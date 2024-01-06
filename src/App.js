import React, {useEffect} from 'react';
import DPlayer from '../dplayer/DPlayer.min.js'
import shaka from '../shaka-player/shaka-player.compiled.js'
import './App.css';


function setupPlay(url,token,contentId) {
  let license_url = 'http://localhost:4000/wvproxy/mlicense?contentid='+contentId;
  const dp = new DPlayer({
      container: document.getElementById('video'),
      subtitle: {url:""},
      video: {
        url: url,
        type: 'customShaka',
        pic:'http://localhost:4000/images/B649d56d13c63ce869.jpeg',
        customType: {
          customShaka: function (video,player) {
              let hasAutoPlay = false;
              let shakaPlayer = new shaka.Player(video)
              shakaPlayer.configure({
                drm: {
                  servers: {'com.widevine.alpha':license_url}
                }
              })
              shakaPlayer.getNetworkingEngine().registerRequestFilter(function(type, request) {
              if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
                  request.headers['X-User-Token'] = token
                }
              })
              shakaPlayer.load(url).then(()=> {
                // if(shakaPlayer.getTextTracks().length > 0) {
                //   shakaPlayer.setTextTrackVisibility(1)
                // }
              })
              player.plugins.shaka = shakaPlayer;
              window.player = shakaPlayer;
              player.container.classList.add('dplayer-loading');
              player.container.setAttribute("inert","")
              player.controller.hide()
              player.on("canplay",()=>{
                if(!hasAutoPlay) {
                  hasAutoPlay = true;
                  player.container.classList.remove('dplayer-loading');
                  player.play()
                  player.subtitle.hide()
                  player.container.removeAttribute("inert")
                }
              })
              player.events.on('subtitle_show', () => {
                shakaPlayer.setTextTrackVisibility(1)
                shakaPlayer.selectTextLanguage('zh','subtitle');
              });
              player.events.on('subtitle_hide', () => {
                shakaPlayer.setTextTrackVisibility(0)
              });
            }
        }
      }
  });
}

function preplay(token,username,password,videoId) {
  if (token.length > 0) {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', 'http://localhost:4000/video_info?token=' + token + '&videoId='+videoId + '&platform=web');
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onload = function () {
      if (this.status === 200) {
        let res = JSON.parse(this.responseText)
        let url = res['url'];
        let contentId = res['content_id']
        setupPlay(url, token,contentId)
      }
    }
    xhr.send();
  } else if(username.length > 0 && password.length > 0){
    const dp = new DPlayer({
      container: document.getElementById('video'),
      live: true,
      video: {
        url: 'http://localhost:4000/video/mpd/manifest.mpd',
        type: 'customShaka',
        pic:'http://localhost:4000/images/B649d56d13c63ce869.jpeg',
        customType: {
          customShaka: function (video,player) {
            let shakaPlayer = new shaka.Player(video)
            shakaPlayer.configure({
              drm: {
                servers: {'com.widevine.alpha':'http://localhost:4000/wvproxy/dvserial?contentid=test'}
              },
            })
            shakaPlayer.getNetworkingEngine().registerResponseFilter((type, response, context) => {
              if(type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
                let deviceId = response.headers['x-auth-device-id'];
                if(deviceId !== undefined) {
                  let xhr = new XMLHttpRequest()
                  xhr.open('GET', 'http://localhost:4000/video_info?deviceId=' + deviceId + '&username=' + username + '&password=' + password+ '&videoId='+videoId);
                  xhr.setRequestHeader('Content-type', 'application/json');
                  xhr.onload = function () {
                    if (this.status === 200) {
                      let res = JSON.parse(this.responseText)
                      let url = res['url'];
                      let token = res['token']
                      let contentId = res['content_id']
                      setupPlay(url,token,contentId)
                    }
                  }
                  xhr.send();
                }
              }
            })
            shakaPlayer.load(video.src);
            player.container.classList.add('dplayer-loading');
            player.container.setAttribute("inert","")
            player.controller.hide()
          }
        }
      }
    });
  }
}

function setupPlay_safari(url,token,contentId) {
  let license_url = 'http://localhost:4000/fps/ksm';
  const dp = new DPlayer({
      container: document.getElementById('video'),
      subtitle: {url:""},
      video: {
        url: url,
        type: 'customShaka',
        pic:'http://localhost:4000/images/B649d56d13c63ce869.jpeg',
        customType: {
          customShaka: function (video,player) {
              video.removeAttribute("preload");
              video.setAttribute("autoplay","");
              let hasAutoPlay = false;
              let shakaPlayer = new shaka.Player()
              shakaPlayer.attach(video);
              shakaPlayer.configure({
                drm: {
                  servers: {'com.apple.fps':license_url},
                  advanced: {
                    'com.apple.fps': {
                      serverCertificateUri : "http://localhost:4000/fps/prod_fairplay.cer"
                    }
                  },
                },
              })

              shakaPlayer.getNetworkingEngine().registerRequestFilter(function(type, request) {
                if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
                  console.log("RequestType.LICENSE")
                    request.headers['X-User-Token'] = token
                    request.headers["Content-type"] = "application/x-www-form-urlencoded"
                    request.headers["X-Request-Device-ID"] = "hex"
                    request.headers["X-Service-ID"] = "super"
                    request.headers["X-Client-Platform"] = "mac_safari"
                    const originalPayload = new Uint8Array(request.body);
                    const base64Payload =
                        shaka.util.Uint8ArrayUtils.toStandardBase64(originalPayload);
                    const params = 'spc=' + base64Payload + '&assetid='+contentId;
                    request.body = shaka.util.StringUtils.toUTF8(params);
                }
              })
              shakaPlayer.getNetworkingEngine().registerResponseFilter((type, response, context) => {
                console.log(response);
                if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
                  console.log("RequestType.LICENSE")
                  let responseText = shaka.util.StringUtils.fromUTF8(response.data);
                  // Trim whitespace.
                  responseText = responseText.trim();
                  // Look for <ckc> wrapper and remove it.
                  if (responseText.substr(0, 5) === '<ckc>' &&
                      responseText.substr(-6) === '</ckc>') {
                    responseText = responseText.slice(5, -6);
                  }
                
                  // Decode the base64-encoded data into the format the browser expects.
                  response.data = shaka.util.Uint8ArrayUtils.fromBase64(responseText).buffer;
                } 
              });

              shakaPlayer.load(url).then(()=>{
                console.log("shakaPlayer loaded");
                
              });
              player.plugins.shaka = shakaPlayer;
              window.player = shakaPlayer;
              player.container.classList.add('dplayer-loading');
              player.container.setAttribute("inert","")
              player.controller.hide()
              player.on("canplay",()=>{
                if(!hasAutoPlay) {
                  hasAutoPlay = true;
                  player.container.classList.remove('dplayer-loading');
                  video.removeAttribute("poster")
                  player.subtitle.hide()
                  player.container.removeAttribute("inert")
                  player.template.barWrap.setAttribute("inert","")
                }
              })
              player.events.on('subtitle_show', () => {
                shakaPlayer.setTextTrackVisibility(1)
                shakaPlayer.selectTextLanguage('zh','subtitle');
              });
              player.events.on('subtitle_hide', () => {
                shakaPlayer.setTextTrackVisibility(0)
              });
            }
        }
      }
  });
}

function preplay_safari(token,username,password,videoId) {
  if (token.length > 0) {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', 'http://localhost:4000/video_info?token=' + token + '&videoId='+videoId + '&platform=ios');
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onload = function () {
      if (this.status === 200) {
        let res = JSON.parse(this.responseText)
        let url = res['url'];
        let contentId = res['content_id']
        setupPlay_safari(url, token,contentId)
      }
    }
    xhr.send();
  } 
}

const App = () => {
  useEffect(()=> {
    let playInSafari = (/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));
    shaka.polyfill.installAll();
    if (!shaka.Player.isBrowserSupported()) {
      alert('Browser is not supported');
  }
    if(playInSafari) {
      shaka.polyfill.PatchedMediaKeysApple.install();
      // shaka.polyfill.PatchedMediaKeysApple.install(/* enableUninstall= */ true);
      // shaka.polyfill.PatchedMediaKeysApple.uninstall();
    }
    let videoId= '768397'//768397
    let xhr = new XMLHttpRequest()
    xhr.open('GET', 'http://localhost:4000/get_user_info');
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onload = function () {
      if (this.status === 200) {
        let res = JSON.parse(this.responseText)
        let token = res['token'];
        let username = res['username'];
        let password = res['password'];
        if(playInSafari){
          preplay_safari(token, username, password, videoId);
          console.log('Safari');
        }else{
          preplay(token, username, password, videoId);
          console.log('Chrome');
        }
      }
    }
    xhr.send();
  }, []);

  return (
    <div className="App">
      <div id="video" className='video'></div>
    </div>
  );
}

export default App;
