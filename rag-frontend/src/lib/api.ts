export type UploadResponse = {
  success?: boolean;
  message?: string;
  detail?: string;
  [key: string]: unknown;
};

export type Source = {
  doc_name: string;
  chunk_text: string;
  score?: number;
};

export type QueryResponse = {
  answer: string;
  sources?: Source[];
};

const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url || url.includes("my-backend-url") || url === "https://my-backend-url") {
    throw new Error(
      "Backend URL not configured. Please create a .env.local file in the rag-frontend directory and set NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 (or your backend URL). Then restart the dev server.",
    );
  }
  return url.replace(/\/$/, "");
};

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  if (files.length === 0) {
    throw new Error("Please select at least one file before uploading.");
  }

  // Upload files one at a time since backend expects single file + document_id
  const results: UploadResponse[] = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    // Generate a unique document_id based on filename and timestamp
    const documentId = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    formData.append("document_id", documentId);

    let response: Response;
    try {
      response = await fetch(`${getBackendUrl()}/upload`, {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        throw new Error(
          "Could not connect to backend. Make sure your backend server is running and NEXT_PUBLIC_BACKEND_URL is set correctly in .env.local (e.g., http://localhost:8000).",
        );
      }
      throw error;
    }

    const payload = await parseResponse<UploadResponse>(response);
    results.push(payload);
  }

  // Return a summary response
  return {
    success: true,
    message: `Successfully uploaded ${results.length} file(s).`,
  };
}

export async function queryQuestion(question: string): Promise<QueryResponse> {
  if (!question.trim()) {
    throw new Error("Please enter a question before sending.");
  }

  let response: Response;
  try {
    response = await fetch(`${getBackendUrl()}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error(
        "Could not connect to backend. Make sure your backend server is running and NEXT_PUBLIC_BACKEND_URL is set correctly in .env.local (e.g., http://localhost:8000).",
      );
    }
    throw error;
  }

  const payload = await parseResponse<QueryResponse>(response);
  return payload;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: T = {} as T;

  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      // Keep data as empty object if the payload is not JSON.
    }
  }

  if (!response.ok) {
    const detail =
      (data as UploadResponse).message ||
      (data as UploadResponse).detail ||
      "Unexpected server error";
    throw new Error(detail);
  }

  return data;
}

