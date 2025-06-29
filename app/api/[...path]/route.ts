import { NextRequest, NextResponse } from 'next/server';

// 從環境變數中讀取後端 API 的真實 URL
// 這是一個伺服器端的環境變數，不會暴露給瀏覽器
// 支持多種環境變數名稱以提高兼容性
const BACKEND_API_URL = process.env.BACKEND_API_URL || 
                       process.env.NEXT_PUBLIC_API_URL ||
                       process.env.API_URL;

/**
 * 動態 API 代理路由
 * @param request - 傳入的請求
 * @param params - 包含動態路徑參數的物件，例如 { path: ['auth', 'login'] }
 */
async function handler(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // 如果後端 URL 未設定，返回錯誤
  if (!BACKEND_API_URL) {
    const errorMessage = '後端 API URL 未配置。請在 Vercel 環境變數中設置：BACKEND_API_URL, NEXT_PUBLIC_API_URL, 或 API_URL';
    console.error(`錯誤：${errorMessage}`);
    console.error('可用的環境變數：', {
      BACKEND_API_URL: process.env.BACKEND_API_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      API_URL: process.env.API_URL
    });
    return NextResponse.json(
      { 
        error: errorMessage,
        suggestion: '請在 Vercel 控制台設置環境變數：BACKEND_API_URL = https://your-zeabur-domain.zeabur.app'
      },
      { status: 500 }
    );
  }

  // 將路徑陣列組合回原始的請求路徑，例如 "auth/login"
  const requestPath = params.path.join('/');

  // 構建要轉發到的目標 URL
  const targetUrl = `${BACKEND_API_URL}/${requestPath}`;
  
  // 在開發環境中記錄代理信息
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 代理請求: ${request.method} ${requestPath} -> ${targetUrl}`);
  }

  try {
    // 複製請求的 headers，並移除 Next.js 可能添加的 host header
    const headers = new Headers(request.headers);
    headers.delete('host');
    
    // 發起 fetch 請求到真實的後端 API
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      // 如果是 GET 或 HEAD 請求，body 必須為 null
      body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
      // 啟用串流傳輸
      // @ts-ignore - duplex 在 Node.js fetch 中是合法的
      duplex: 'half',
    });

    // 將後端的響應直接串流回客戶端，這樣可以處理各種內容類型（JSON, HTML, 檔案等）
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (error) {
    console.error(`API 代理錯誤 (轉發到 ${targetUrl}):`, error);
    return NextResponse.json(
      { error: '代理請求到後端服務時發生錯誤。' },
      { status: 502 } // 502 Bad Gateway
    );
  }
}

// 將 handler 函數導出為所有相關的 HTTP 方法
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const HEAD = handler;
export const OPTIONS = handler; 