import os
import urllib.request
import json
import base64

def upload_file(repo, filepath, github_token, branch="main"):
    filename = os.path.basename(filepath)
    url = f"https://api.github.com/repos/{repo}/contents/{filename}"
    
    # Read file content and encode in Base64
    with open(filepath, "rb") as f:
        content = base64.b64encode(f.read()).decode("utf-8")
    
    # We need to get the file SHA if it already exists, to update it
    sha = None
    req = urllib.request.Request(
        url + f"?ref={branch}",
        headers={
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Mozilla/5.0"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            sha = data.get("sha")
    except Exception as e:
        # File doesn't exist yet, which is fine
        pass

    # Prepare data payload
    payload = {
        "message": f"Upload {filename} via API",
        "content": content,
        "branch": branch
    }
    if sha:
        payload["sha"] = sha
        
    data_bytes = json.dumps(payload).encode("utf-8")
    
    # Send PUT request
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        },
        method="PUT"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status in (200, 201):
                print(f"Successfully uploaded {filename}!")
                return True
    except Exception as e:
        print(f"Failed to upload {filename}: {e}")
        return False

if __name__ == "__main__":
    import sys
    print("=========================================")
    print(" GitHub API File Uploader (No Git Required)")
    print("=========================================")
    repo = "pimprakai/pimprakai.github.io"
    
    if len(sys.argv) > 1:
        token = sys.argv[1].strip()
    else:
        token = input("Please enter your GitHub Personal Access Token (PAT): ").strip()
        
    if not token:
        print("Token is required.")
        exit(1)
        
    files = ["index.html", "style.css", "app.js"]
    success_count = 0
    for f in files:
        if os.path.exists(f):
            if upload_file(repo, f, token):
                success_count += 1
        else:
            print(f"File {f} not found.")
            
    print(f"\nCompleted. Uploaded {success_count}/{len(files)} files.")
    input("\nPress Enter to exit...")
