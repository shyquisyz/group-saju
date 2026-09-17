import http.server,base64
class H(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        n=int(self.headers['Content-Length']);d=self.rfile.read(n).decode()
        name=self.path.strip('/').replace('/','_')
        open('out_'+name,'wb').write(base64.b64decode(d.split(',',1)[1]))
        self.send_response(200);self.end_headers();self.wfile.write(b'ok')
http.server.ThreadingHTTPServer(('127.0.0.1',8936),H).serve_forever()
