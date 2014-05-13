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
                                            {"/signaling", handler_websocket,[]},
					                                  {"/signin", handler_signin,[]},
					                                  {"/signout", handler_signout,[]},
                                            {"/conference/[...]", cowboy_static, {priv_dir, rtcserver, "",[{mimetypes, cow_mimetypes, all}]}},
                                            {"/", handler_index,[]}
                                       ]}
                                     ]),
    {ok, _} = cowboy:start_http(websocket, 100, [{ip,{127,0,0,1}},{port, 30004}], [
                                {env, [{dispatch, Dispatch}]},
                                {max_keepalive, 50},
                                {timeout, 500},
				{onrequest, fun handler_session:on_request/1}
                                                           ]),
    handler_session:init(),
    rtcserver_sup:start_link().

stop(_State) ->
    ok.


