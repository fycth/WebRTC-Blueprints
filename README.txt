Hello!
Here you can find source codes of demo applications for first four chapters.

1. Web server configuration.
Please, configure your web server before running demo applications.
In the 'nginx-configuration' folder you can find example configuration file for NGINX web server.
By default, all applications configured to use HTTPS, so you need to generate a security certificate.
Please, refer to the book for details on using secure and non-secure configurations.

2. How to build and start an application
- prepare environment (install Erlang and other tools, - please, refer to the book on this)
- go to the application folder ('chapter1', for example)
- execute 'rebar get-deps'
- execute 'rebar compile'
- execute ./start.sh (or start.bat if you're working on MS Windows)

3. How to test an application
By default, each application is configured to be executed from its appropriate sub-folder.
For example:
http://<YOUR_SERVER_NAME>/chapter1 
http://<YOUR_SERVER_NAME>/chapter2
etc.
After you have configured the web server and compiled demo application, you can test it.
Navigate your web browser to http://<YOUR_SERVER_NAME>/<APPLICATION_NAME>

4. Please, refer to the book on further details of using and developing demo applications

5. These applications are running and available at http://www.webrtcblueprints.com
You can visit the page and test every of these four applications online.

