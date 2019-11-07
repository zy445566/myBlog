#include <node_api.h>
#include <assert.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include<fcntl.h>
#include<stdio.h>
#include<stdlib.h>
#include<unistd.h>

#define SHARE_PATH "share-data"
napi_value createInt(napi_env env,long num) {
  napi_status status;
  napi_value int_value;
  status = napi_create_int32(env, num, &int_value);
  assert(status == napi_ok);
  return int_value;
}

long get_share_adress(size_t min_size,int is_init=0) {
  int open_type = O_RDWR|O_EXCL;
  int fd = open(SHARE_PATH, open_type, 0777);
  if(fd<0) {return fd;}
  struct stat st;
  if((fstat(fd, &st))<0){return -1;}
  size_t mmap_size = st.st_size | min_size;
  char* mmap_ptr = (char *)mmap(NULL, mmap_size, PROT_READ| PROT_WRITE, MAP_SHARED, fd, 0);
  close(fd);
  return (long)mmap_ptr;
}

napi_value readMethod(napi_env env, napi_callback_info info) {
  napi_status status;
  size_t min_size = 1024;
  char* mmap_ptr = (char* )get_share_adress(min_size);
  napi_value read_string_data;
  status = napi_create_string_utf8(env, mmap_ptr, min_size, &read_string_data);
  assert(status == napi_ok);
  return read_string_data;
}

napi_value writeMethod(napi_env env, napi_callback_info info) {
  napi_status status;
  size_t argc = 1;
  napi_value args[argc];
  status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  assert(status == napi_ok);
  size_t min_size = 1024;
  char* mmap_ptr = (char* )get_share_adress(min_size);
  size_t* result = nullptr;
  status = napi_get_value_string_utf8(env,args[0],mmap_ptr,min_size,result);
  assert(status == napi_ok);
  return createInt(env, (long) result);
}

#define DECLARE_NAPI_METHOD(name, func)                          \
  { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_property_descriptor writeDescriptor = DECLARE_NAPI_METHOD("write", writeMethod);
  napi_property_descriptor readDescriptor = DECLARE_NAPI_METHOD("read", readMethod);
  status = napi_define_properties(env, exports, 1, &readDescriptor);
  assert(status == napi_ok);
  status = napi_define_properties(env, exports, 1, &writeDescriptor);
  assert(status == napi_ok);
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)