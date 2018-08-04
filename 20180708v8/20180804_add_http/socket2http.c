#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <string.h>
#include <sys/stat.h>
#include <ctype.h>
#include <unistd.h>

#define SERVER_STRING "Server: zy's httpd/0.1.1\r\n"
#define ISspace(x) isspace((int)(x))

void accept_request(void *);
int get_line(int, char *, int);
int startup(u_short *);
void hellohttp(int);

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

int get_line(int sock, char *buf, int size)
{
    int i = 0;
    char c = '\0';
    int n;

    while ((i < size - 1) && (c != '\n'))
    {
        n = recv(sock, &c, 1, 0);
        /* DEBUG printf("%02X\n", c); */
        if (n > 0)
        {
            if (c == '\r')
            {
                n = recv(sock, &c, 1, MSG_PEEK);
                /* DEBUG printf("%02X\n", c); */
                if ((n > 0) && (c == '\n'))
                    recv(sock, &c, 1, 0);
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

void hellohttp(int client)
{
    char buf[1024];
    sprintf(buf, "HTTP/1.0 200 OK\r\n");
    send(client, buf, strlen(buf), 0);
    sprintf(buf, SERVER_STRING);
    send(client, buf, strlen(buf), 0);
    sprintf(buf, "Content-Type: text/html\r\n");
    send(client, buf, strlen(buf), 0);
    sprintf(buf, "\r\n");
    send(client, buf, strlen(buf), 0);
    sprintf(buf, "<HTML><HEAD>\r\n");
    send(client, buf, strlen(buf), 0);
    sprintf(buf, "<TITLE>this is zy'http server</TITLE>\r\n");
    send(client, buf, strlen(buf), 0);
    sprintf(buf, "</HEAD>\r\n");
    send(client, buf, strlen(buf), 0);
    sprintf(buf, "<BODY>\r\n");
    send(client, buf, strlen(buf), 0);
    sprintf(buf, "<P>welcome to zy'http server.</P>\r\n");
    send(client, buf, strlen(buf), 0);
    sprintf(buf, "</BODY></HTML>\r\n");
    send(client, buf, strlen(buf), 0);
}

void accept_request(void *arg)
{
    int client = (intptr_t)arg;
    char buf[1024];
    size_t numchars;
    char method[255];
    char url[255];
    char path[512];
    size_t i, j;
    // 这里使用了sys/stat.h库的定义的结构体
    struct stat st;
    char *query_string = NULL;

    numchars = get_line(client, buf, sizeof(buf));
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
    while ((numchars > 0) && strcmp("\n", buf))
            numchars = get_line(client, buf, sizeof(buf));
    hellohttp(client);
    //unistd库的方法用于关闭文件读取，类似fclose
    close(client);
}

int main()
{
    int server_sock = -1;
    u_short port = 4000;
    int client_sock = -1;
    struct sockaddr_in client_name;
    socklen_t  client_name_len = sizeof(client_name);

    server_sock = startup(&port);
    printf("httpd running on port %d\n", port);
    while(1){
        client_sock = accept(server_sock,
                    (struct sockaddr *)&client_name,
                    &client_name_len);
        if (client_sock == -1)
                printf("accept");
        accept_request((void *)(intptr_t)client_sock);
    }
    close(server_sock);
    return 0;
}