const WEBHOOK_ID = "";
const WEBHOOK_TOKEN = "";
const WEBHOOK_URL = `https://discord.com/api/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(renderHTML(), {
        headers: { "Content-Type": "text/html" },
      });
    } else if (url.pathname === "/trigger-message" && request.method === "POST") {
      return await triggerMessage(request);
    } else {
      return new Response("Not Found", { status: 404 });
    }
  },
};


function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workers Discord Bot</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f4f7fb;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .container {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 600px;
    }
    h1 {
      text-align: center;
      color: #333;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    label {
      font-size: 14px;
      color: #333;
      margin-bottom: 5px;
    }
    textarea, input {
      padding: 10px;
      font-size: 14px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 15px;
      width: 100%;
      box-sizing: border-box;
    }
    textarea {
      height: 100px;
    }
    button {
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    button:hover {
      background-color: #0056b3;
    }
    #response {
      margin-top: 20px;
      padding: 10px;
      background-color: #e9ecef;
      border-radius: 4px;
      color: #333;
      font-size: 14px;
    }
    input[type="file"] {
      display: none; /* Hide the file input field */
    }
    .file-label {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .file-button {
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    .file-button:hover {
      background-color: #0056b3;
    }
    #fileName {
      margin-left: 10px;
      font-size: 14px;
      color: #555;
    }    
  </style>
</head>
<body>
  <div class="container">
    <h1>Workers Discord Bot Send Message WebUI</h1>
    <form id="messageForm">
      <label for="content">Message Content:</label>
      <textarea id="content" name="content" required></textarea>
      <label for="username">Username (optional):</label>
      <input id="username" name="username" type="text">
      <label for="file">File (optional):</label>
      <input id="file" name="file" type="file" accept="image/*">
      <div class="file-label">
        <label for="file" class="file-button">Upload File</label>
        <span id="fileName">No file chosen</span>
      </div>
      <button type="submit">Send Message</button>
    </form>
    <div id="response"></div>
  </div>

  <script>
  const form = document.getElementById('messageForm');
  const contentField = document.getElementById('content');
  const fileInput = document.getElementById('file');

  
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    const fileName = document.getElementById('fileName');
    if (file) {
      if (file.size > 7.99 * 1024 * 1024) { // 7.99 MB in bytes
        alert('File size exceeds 7.99 MB. Please select a smaller file.');
        fileInput.value = ''; // Clear the input
        fileName.textContent = 'No file chosen';
      } else {
        fileName.textContent = file.name;
        contentField.removeAttribute('required');
      }
    } else {
      contentField.setAttribute('required', '');
      fileName.textContent = 'No file chosen';
    }
  });
  

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const file = fileInput.files[0];
    const content = formData.get('content');
    const payload = { content: content || "", username: formData.get('username') };

    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        payload.file = {
          name: file.name,
          type: file.type,
          data: base64,
        };
        await sendRequest(payload);
      };
      reader.readAsDataURL(file);
    } else if (content || file) { 
      await sendRequest(payload);
    } else {
      const responseDiv = document.getElementById('response');
      responseDiv.textContent = "Please provide a message or a file to send.";
      responseDiv.style.backgroundColor = '#f8d7da'; // Red background on error
      responseDiv.style.color = '#721c24'; // Dark red text
    }
  });

  async function sendRequest(payload) {
    const responseDiv = document.getElementById('response');
    try {
      const response = await fetch('/trigger-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      if (response.ok) {
        responseDiv.textContent = text;
        responseDiv.style.backgroundColor = '#d4edda'; // Green background on success
        responseDiv.style.color = '#155724'; // Dark green text
      } else {
        responseDiv.textContent = text;
        responseDiv.style.backgroundColor = '#f8d7da'; // Red background on error
        responseDiv.style.color = '#721c24'; // Dark red text
      }
    } catch (err) {
      responseDiv.textContent = err.message;
      responseDiv.style.backgroundColor = '#f8d7da'; // Red background on error
      responseDiv.style.color = '#721c24'; // Dark red text
    }
  }
</script>


</body>
</html>
  `;
}

async function triggerMessage(request) {
  try {
    const { content, username = "Cloudflare Workers NB Bot", file } = await request.json();

    if (!content && !file) {
      return new Response("Message content or file is required", { status: 400 });
    }

    const formData = new FormData();

    if (content) formData.append("content", content);
    if (username) formData.append("username", username);

    if (file) {
      const { name, type, data } = file;
      const fileBlob = new Blob([Uint8Array.from(atob(data), c => c.charCodeAt(0))], { type });
      formData.append("file", fileBlob, name);
    }

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData,
    });

    if (response.status === 204 || response.status === 200) {
      return new Response("Message sent successfully!", { status: 200 });
    } else {
      const errorText = await response.text();
      console.error("Discord API Response:", errorText); 
      return new Response(`Failed to send message: ${errorText}`, { status: response.status });
    }
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
