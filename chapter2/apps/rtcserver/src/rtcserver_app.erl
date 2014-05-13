-module(rtcserver_app).

-behaviour(application).

-export([start/2, stop/1, start/0]).

start() ->
    ok = application:start(compiler),
    ok = application:start(ranch),
    ok = application:start(crypto),
    ok = application:start(cowlib),
    ok = application:start(cowboy),
    ok = application:start(gproc),
    ok = application:start(rtcserver).

start(_StartType, _StartArgs) ->
    Dispatch = cowboy_router:compile([
                                      {'_',[
                                            {"/signaling", handler_websocket,[]}
                                           ]}
                                     ]),
    {ok, _} = cowboy:start_http(websocket, 100, [{ip,{127,0,0,1}},{port, 30002}], [
                                {env, [{dispatch, Dispatch}]},
                                {max_keepalive, 50},
                                {timeout, 500}
                                                           ]),
    rtcserver_sup:start_link().

stop(_State) ->
    ok.


