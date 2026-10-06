import uvicorn
from config import HOST, PORT

if __name__ == "__main__":
    print(f"Starting EchoMorph Backend on http://{HOST}:{PORT}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
