#include <sys/socket.h>
#include <include/v8.h>

void accept_request(void *);
size_t get_line(intptr_t sock, char *buf, size_t size);
int startup(u_short *);
void hellohttp(intptr_t);
void Http(const v8::FunctionCallbackInfo<v8::Value>& args);