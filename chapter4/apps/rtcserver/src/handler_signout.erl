
-module(handler_signout).
-export([init/3, handle/2, terminate/3]).

init({tcp, http}, Req, _) ->
    {ok, Req, undefined_state}.

handle(Req, State) ->
    Req2 = handler_session:drop_session(Req),
    Req3 = cowboy_req:set_resp_header(<<"Location">>,<<"/">>,Req2),
    {ok, Req5} = cowboy_req:reply(302, [], <<"">>, Req3),
    {ok, Req5, State}.

terminate(_Reason, _Req, _State) ->
    ok.
