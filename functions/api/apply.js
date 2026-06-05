const FALLBACK_GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxTAD78O1Zbd8o5gEoGUbTzYGFIUuWnmtcyExe5rR-uXjzaoBb68MBGraz10ouUsD9Q3g/exec";

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

export async function onRequestPost({ request, env }) {
  const scriptUrl = env.GOOGLE_SCRIPT_URL || FALLBACK_GOOGLE_SCRIPT_URL;

  try {
    const formData = await request.formData();
    const body = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      body.append(key, String(value));
    }

    const sheetResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body,
    });

    if (!sheetResponse.ok) {
      const message = await sheetResponse.text();
      return jsonResponse(
        {
          ok: false,
          error: "Google Sheet 전송에 실패했습니다.",
          status: sheetResponse.status,
          message: message.slice(0, 500),
        },
        { status: 502 },
      );
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "지원서 전송 중 서버 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
}
