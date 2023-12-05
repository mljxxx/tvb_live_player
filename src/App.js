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
    xhr.open('GET', 'http://localhost:4000/video_info?token=' + token + '&videoId='+videoId);
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

const App = () => {
  useEffect(()=> {
    let videoId= ''
    let xhr = new XMLHttpRequest()
    xhr.open('GET', 'http://localhost:4000/get_user_info');
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onload = function () {
      if (this.status === 200) {
        let res = JSON.parse(this.responseText)
        let token = res['token'];
        let username = res['username'];
        let password = res['password'];
        preplay(token,username,password,videoId);
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
