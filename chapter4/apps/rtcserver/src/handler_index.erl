-module(handler_index).
%%-behaviour(cowboy_http_handler).
-export([init/3, handle/2, terminate/3]).

-include("records.hrl").

init({_Any, http}, Req, []) ->
    {ok, Req, undefined}.

handle(Req, State) ->
    {Method, Req1} = cowboy_req:method(Req),
    HasBody = cowboy_req:has_body(Req1),
    {ok, Req2} = process_request(Method, HasBody, Req1),
    {ok, Req2, State}.

process_request(<<"POST">>, true, Req) ->
    {ok, PostVals, Req1} = cowboy_req:body_qs(Req),
    Email = proplists:get_value(<<"n_email">>, PostVals),
    Password = proplists:get_value(<<"n_password">>, PostVals),
    V = validate_login(Email, Password),
    case V of
        false ->
            Req2 = Req1,
            {ok, Content} = signin_failed_dtl:render([]),
            cowboy_req:reply(200, [], Content, Req2);
        ID ->
            Req2 = handler_session:set_session(Req,#session{id = ID, email = Email}),
            {ok, Content} = signin_success_dtl:render([ID]),
            cowboy_req:reply(200, [], Content, Req2)
    end;

process_request(<<"GET">>, false, Req) ->
    {ok, Content} = index_dtl:render([]),
    cowboy_req:reply(200, [], Content, Req).
   
terminate(_Reason, _Req, _State) ->
    ok.

validate_login(Email,Password) ->
  case Email of
    <<"user@myserver.com">> ->
      case Password of
        <<"secretword">> ->
          true;
        _ ->
          false
      end;
    _ -> false
  end.