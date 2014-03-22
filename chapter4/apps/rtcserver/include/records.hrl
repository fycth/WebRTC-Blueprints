
-record(session,
        {
          id,
          expires :: integer(),
          email :: binary()
         }).

-record(user,
        {
          fname :: binary(),
          lname :: binary(),
          password :: binary()
        }).

-record(course,
        {
          name :: binary(),
          desc :: binary()
        }).

-record(interactive,
        {
          name,
          desc,
          invite,
          price
        }).

-record(lesson,
        {
          name :: binary(),
          desc :: binary(),
          video_link :: binary() | none()
        }).
