
-module(handler_session).
-export([on_request/1, set_session/2, drop_session/1, init/0]).

-include("records.hrl").

-define(SESSION_NAME, <<"sid">>).

% TTL - Time To Live for session, 1 day
-define(TTL, 60 * 60 * 24).

%
% create new ETS table for session store
%
init() -> ets:new(ets_sessions, [set, named_table, public, {keypos,1}]).

%
% this function executes for every HTTP request
% check whether the request has a cookie with session ID
% and route it to appropriate web page
%
on_request(Req) ->
    {Path, Req1} = cowboy_req:path(Req),
    % get session
    {SESSID, Req2} = cowboy_req:cookie(?SESSION_NAME, Req1),
    case SESSID of
        undefined ->
            session_no(Req2, Path);
        _ ->
            PEER = load_session(SESSID),
            case PEER of
                undefined -> session_no(Req2, Path);
                _ -> session_yes(Req2, Path)
            end
    end.

%
% user's browser doesn't have session ID
% or it has but we don't have such a session in ETS
%
session_no(Req, Path) ->
    case lists:member(Path,[<<"/chapter4/conference">>]) of
        true ->
            Req1 = cowboy_req:set_resp_header(<<"Location">>, <<"/chapter4">>, Req),
            {ok, Req2} = cowboy_req:reply(302, [], "", Req1),
            Req2;
        _ -> Req
    end.

%
% user's browser has sessison ID
% and we have session stored in ETS
%
session_yes(Req, Path) ->
    case lists:member(Path,[<<"/chapter4/signin">>, <<"/chapter4">>]) of
        true ->
            Req1 = cowboy_req:set_resp_header(<<"Location">>,<<"/chapter4/conference">>,Req),
            {ok, Req2} = cowboy_req:reply(302, [], "", Req1),
            Req2;
        _ -> Req
    end.

%
% store session ID in users's browser cookie
%
set_session(Req, Data) ->
    SID = generate_session(), 
    % get unix-style timestamp
    {M,S,_} = now(),
    T = M * 1000000 + S,
    % calculate expiration time and add it to the session record
    TTL = T + ?TTL,
    Data1 = Data#session{expires = TTL}, 
    % store session on server
    ets:insert(ets_sessions, {SID, Data1}),
    % set session cookie on browser
    Req1 = cowboy_req:set_resp_cookie(?SESSION_NAME,SID,[{path, <<"/">>}],Req),
    Req1.

%
% remove session cookie from the browser
% (called when user wants to sign out)
%
drop_session(Req) -> cowboy_req:set_resp_header(<<"Set-Cookie">>,<<?SESSION_NAME/binary,"=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/">>, Req).

%Options = [{path, <<"/">>}],
%Req2=cowboy_req:set_resp_cookie(<<"sessid">>,<<"deleted">>,[{set_age, 0},{local_time, {{1970,1,1},{0,0,0}}}|Options],Req1)

%
% lookup for session stored in ETS
% if sessions exists but expired, remove it from ETS and return undefined (no session)
%
load_session(SID) ->
    case ets:lookup(ets_sessions, SID) of
        [] -> undefined;
        [{SID, DATA}] -> DATA
    end.

%
% generate session ID
%
-spec generate_session() -> binary().
generate_session() ->
    Now = {_, _, Micro} = now(),
    Nowish = calendar:now_to_universal_time(Now),
    Nowsecs = calendar:datetime_to_gregorian_seconds(Nowish),
    Then = calendar:datetime_to_gregorian_seconds({{1970, 1, 1}, {0, 0, 0}}),
    Prefix = io_lib:format("~14.16.0b", [(Nowsecs - Then) * 1000000 + Micro]),
    list_to_binary(Prefix ++ to_hex(crypto:rand_bytes(9))).

% 
-spec to_hex([]) -> [];
            (binary()) -> list();
            (list()) -> list().
to_hex([]) ->
    [];
to_hex(Bin) when is_binary(Bin) ->
    to_hex(binary_to_list(Bin));
to_hex([H|T]) ->
    [to_digit(H div 16), to_digit(H rem 16) | to_hex(T)].

% 
-spec to_digit(number()) -> number().
to_digit(N) when N < 10 -> $0 + N;
to_digit(N) -> $a + N-10.
