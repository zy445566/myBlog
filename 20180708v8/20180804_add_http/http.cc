#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <string.h>
#include <ctype.h>
#include <unistd.h>
#include <include/v8.h>

#define SERVER_STRING "Server: zy's httpd/0.1.0\r\n"
#define ISspace(x) isspace((int)(x))

v8::Persistent<v8::Function> g_cb;

int startup(u_short *port)
{
    int httpd = 0;
    int on = 1;
    struct sockaddr_in name;
    //PF_INET 和 AF_INET 类似都是使用IP
    httpd = socket(PF_INET, SOCK_STREAM, 0);
    if (httpd == -1)
        printf("socket create error");
    //这里的memset不是memory.h而是string.h用于将name全部填充0
    memset(&name, 0, sizeof(name));
    name.sin_family = AF_INET;
    name.sin_port = htons(*port);
    name.sin_addr.s_addr = htonl(INADDR_ANY);
    if ((setsockopt(httpd, SOL_SOCKET, SO_REUSEADDR, &on, sizeof(on))) < 0)  
    {  
        printf("setsockopt failed");
    }
    if (bind(httpd, (struct sockaddr *)&name, sizeof(name)) < 0)
        printf("bind");
    if (*port == 0)  /* if dynamically allocating a port */
    {
        socklen_t namelen = sizeof(name);
        if (getsockname(httpd, (struct sockaddr *)&name, &namelen) == -1)
            printf("getsockname");
        *port = ntohs(name.sin_port);
    }
    if (listen(httpd, 5) < 0)
        printf("listen");
    return(httpd);
}

size_t get_line(intptr_t sock, char *buf, size_t size)
{
    size_t i = 0;
    char c = '\0';
    ssize_t n;
    size_t num = 1;

    while ((i < size - 1) && (c != '\n'))
    {
        n = recv((int)sock, &c, num, 0);
        /* DEBUG printf("%02X\n", c); */
        if (n > 0)
        {
            if (c == '\r')
            {
                n = recv((int)sock, &c, 1, MSG_PEEK);
                /* DEBUG printf("%02X\n", c); */
                if ((n > 0) && (c == '\n'))
                    recv((int)sock, &c, num, 0);
                else
                    c = '\n';
            }
            buf[i] = c;
            i++;
        }
        else
            c = '\n';
    }
    buf[i] = '\0';

    return(i);
}

const char* HttpToCString(const v8::String::Utf8Value& value) {
    return *value ? *value : "<string conversion failed>";
}

void sendWithRN(int client_num,const char* data)
{
    char cstr_rn[strlen(data)+2];
    strcpy(cstr_rn, data);
    strcat(cstr_rn,"\r\n");
    send(client_num, cstr_rn, strlen(cstr_rn), 0);
}

void respSetHeaders(
    int client_num,
    const v8::FunctionCallbackInfo<v8::Value>& args,
    v8::Local<v8::Object> resp_headers
)
{
    v8::Local<v8::Array> resp_headers_keys= resp_headers->GetPropertyNames();
    uint32_t len = resp_headers_keys->Length();
    for(uint32_t i = 0; i < len; i++){
        char buf[1024];
        v8::Local<v8::String> header = resp_headers_keys->Get(i)->ToString();
        v8::Local<v8::String> value = resp_headers->Get(header)->ToString();
        v8::String::Utf8Value header_utf(args.GetIsolate(), header);
        const char* header_cstr =  HttpToCString(header_utf);
        v8::String::Utf8Value value_utf(args.GetIsolate(), value);
        const char* value_cstr =  HttpToCString(value_utf);
        sprintf(buf, "%s: %s", header_cstr,value_cstr);
        sendWithRN(client_num,buf);
    }
}

void hellohttp(intptr_t client,
const v8::FunctionCallbackInfo<v8::Value>& args,
v8::Local<v8::Object> resp)
{
    
    int client_num = (int)client;
    char buf[1024];
    v8::Local<v8::String> status = resp->Get(v8::String::NewFromUtf8(args.GetIsolate(), "status", v8::NewStringType::kNormal)
            .ToLocalChecked())->ToString();
    v8::String::Utf8Value status_utf(args.GetIsolate(), status);
    const char* status_cstr =  HttpToCString(status_utf);
    sendWithRN(client_num, status_cstr);
    v8::Local<v8::Object> resp_headers = resp->Get(v8::String::NewFromUtf8(args.GetIsolate(), "headers", v8::NewStringType::kNormal)
            .ToLocalChecked())->ToObject();
    respSetHeaders(client_num,args,resp_headers);
    sprintf(buf, "\r\n");
    send(client_num, buf, strlen(buf), 0);
    v8::Local<v8::String> body = resp->Get(v8::String::NewFromUtf8(args.GetIsolate(), "body", v8::NewStringType::kNormal)
            .ToLocalChecked())->ToString();
    v8::String::Utf8Value body_utf(args.GetIsolate(), body);
    const char* body_cstr =  HttpToCString(body_utf);
    sendWithRN(client_num, body_cstr);
}

void accept_request(void *arg,
const v8::FunctionCallbackInfo<v8::Value>& args,
v8::Local<v8::Object> req,
v8::Local<v8::Object> resp
)
{
    intptr_t client = (intptr_t)arg;
    char buf[1024];
    size_t numchars;
    char method[255];
    size_t i, j;

    numchars = get_line(client, buf, sizeof(buf));
    req->Set(
        v8::String::NewFromUtf8(args.GetIsolate(), "status", v8::NewStringType::kNormal)
            .ToLocalChecked(),
        v8::String::NewFromUtf8(args.GetIsolate(), buf, v8::NewStringType::kNormal)
            .ToLocalChecked()
    );
    i = 0; j = 0;
    //ISspace是ctype库用于检查是否有空白字符
    while (!ISspace(buf[i]) && (i < sizeof(method) - 1))
    {
        method[i] = buf[i];
        i++;
    }
    j=i;
    method[i] = '\0';
    // 将全部请求接收完
    char* header_str;
    char header_name[1024];
    char header_value[1024];
    while ((numchars > 0) && strcmp("\n", buf)){
        numchars = get_line(client, buf, sizeof(buf));
        header_str=strtok(buf,": ");
        if (header_str != NULL) {
            strcpy(header_name,header_str);
            // printf("header_str=%s\n", header_str);
            header_str = strtok(NULL, ": ");
            if(header_str != NULL){
                strcpy(header_value,header_str);
                req->Set(
                    v8::String::NewFromUtf8(args.GetIsolate(), header_name, v8::NewStringType::kNormal)
                        .ToLocalChecked(),
                    v8::String::NewFromUtf8(args.GetIsolate(), header_value, v8::NewStringType::kNormal)
                        .ToLocalChecked()
                );
            }
            
        }
    }
    v8::Local<v8::Object> headers = v8::Object::New(args.GetIsolate());
    headers->Set(
        v8::String::NewFromUtf8(args.GetIsolate(), "Server", v8::NewStringType::kNormal)
            .ToLocalChecked(),
        v8::String::NewFromUtf8(args.GetIsolate(), "zy's httpd/0.1.0", v8::NewStringType::kNormal)
            .ToLocalChecked()
    );
    headers->Set(
        v8::String::NewFromUtf8(args.GetIsolate(), "Content-Type", v8::NewStringType::kNormal)
            .ToLocalChecked(),
        v8::String::NewFromUtf8(args.GetIsolate(), "text/html", v8::NewStringType::kNormal)
            .ToLocalChecked()
    );
    resp->Set(
        v8::String::NewFromUtf8(args.GetIsolate(), "headers", v8::NewStringType::kNormal)
            .ToLocalChecked(),headers
    );
    const char default_body[1024]="<HTML><HEAD><TITLE>zynode_http</TITLE></HEAD><BODY><P>welcome to zynode http server.</P></BODY></HTML>";
    resp->Set(
        v8::String::NewFromUtf8(args.GetIsolate(), "body", v8::NewStringType::kNormal)
            .ToLocalChecked(),
        v8::String::NewFromUtf8(args.GetIsolate(), default_body, v8::NewStringType::kNormal)
            .ToLocalChecked()
    );
    resp->Set(
        v8::String::NewFromUtf8(args.GetIsolate(), "status", v8::NewStringType::kNormal)
            .ToLocalChecked(),
        v8::String::NewFromUtf8(args.GetIsolate(), "HTTP/1.0 200 OK", v8::NewStringType::kNormal)
            .ToLocalChecked()
    );
    v8::Local<v8::Function> now_cb = v8::Local<v8::Function>::New(args.GetIsolate(),g_cb);
    const unsigned argc = 2;
    v8::Local<v8::Value> argv[argc] = { 
        req,
        resp
    };
    now_cb->Call(args.GetIsolate()->GetCurrentContext()->Global(), argc, argv);

    hellohttp(client,args,resp);
    //unistd库的方法用于关闭文件读取，类似fclose
    close((int)client);
}

void ListenPort(const v8::FunctionCallbackInfo<v8::Value>& args) {
    if (args.Length() != 1) {
    args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(), "Bad parameters,only one parameter",
                                v8::NewStringType::kNormal).ToLocalChecked());
        return;
    }
    if(!args[0]->IsNumber())
    {
        args.GetIsolate()->ThrowException(
            v8::String::NewFromUtf8(args.GetIsolate(), "Parameter is not number",
                                    v8::NewStringType::kNormal).ToLocalChecked());
        return;
    }
    int server_sock = -1;
    u_short port = (u_short)args[0]->NumberValue();;
    int client_sock = -1;
    struct sockaddr_in client_name;
    socklen_t  client_name_len = sizeof(client_name);

    server_sock = startup(&port);
    // printf("httpd running on port %d\n", port);
    while(1){
        client_sock = accept(server_sock,
                    (struct sockaddr *)&client_name,
                    &client_name_len);
        if (client_sock == -1)
                printf("accept");
        v8::Local<v8::Object> req = v8::Object::New(args.GetIsolate());
        v8::Local<v8::Object> resp = v8::Object::New(args.GetIsolate());
        accept_request((void *)(intptr_t)client_sock,args,req,resp);
    }
    // close(server_sock);
}


void Http(const v8::FunctionCallbackInfo<v8::Value>& args) {
  if (args.Length() != 1) {
    args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(), "Bad parameters,only one parameter",
                                v8::NewStringType::kNormal).ToLocalChecked());
    return;
  }
  if(!args[0]->IsFunction())
  {
      args.GetIsolate()->ThrowException(
        v8::String::NewFromUtf8(args.GetIsolate(), "Parameter is not function",
                                v8::NewStringType::kNormal).ToLocalChecked());
    return;
  }
  g_cb.Reset(args.GetIsolate(),args[0].As<v8::Function>());
//   v8::Persistent<v8::Function> cb(args.GetIsolate(),args[0].As<v8::Function>());
//   memcpy(&g_cb,&cb,sizeof(v8::Persistent<v8::Function>));
//   cb = args[0].As<v8::Function>();
  v8::Local<v8::Object> http_object = v8::Object::New(args.GetIsolate());
  http_object->Set(
      v8::String::NewFromUtf8(args.GetIsolate(), "listen", v8::NewStringType::kNormal)
          .ToLocalChecked(),
      v8::FunctionTemplate::New(args.GetIsolate(), ListenPort)->GetFunction());
      
  args.GetReturnValue().Set(http_object);
  }


  