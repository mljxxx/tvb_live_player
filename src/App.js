import React, {useEffect} from 'react';
import dashjs from '../dashjs/dash.all.min.js';
import DPlayer from '../dplayer/DPlayer.min.js'
import './App.css';

function setupPlay(url,token) {
  const dp = new DPlayer({
    container: document.getElementById('video'),
    autoplay:true,
    subtitle: {
      url:""
    },
    video: {
      url: url,
      type: 'customDash',
      pic: "https://lbsugc.cdn.bcebos.com/images/B649d56d13c63ce869.jpeg",
      customType: {
        customDash: function (video,player) {
          let protData = {
            'com.widevine.alpha': {
              'serverURL': 'http://localhost:4000/wvproxy/mlicense?contentid=ott_J_h264',
              'httpRequestHeaders': {
                'x-user-token': token
              }
            }
          }
          let dash_player = dashjs.MediaPlayer().create();
          dash_player.initialize(video, video.src, true);
          dash_player.setProtectionData(protData);
          dash_player.updateSettings({
            streaming:{
              text: {
                defaultEnabled: false,
              },delay: { 
                liveDelayFragmentCount: 0 
              }
            }
          })
          dash_player.setAutoPlay(true);
          dash_player.attachTTMLRenderingDiv(player.template.subtitle)
          player.container.classList.add('dplayer-loading');
          player.plugins.dash = dash_player;
          player.container.setAttribute("inert","")
          player.controller.hide()
          player.on("canplay",()=>{
            player.play()
            player.container.removeAttribute("inert")
          })
          player.events.on('subtitle_show', () => {
            dash_player.enableText(true);
          });
          player.events.on('subtitle_hide', () => {  
            dash_player.enableText(false);
          });
        }
      }
    }
  });
  dp.play();
}

const App = () => {
  useEffect(()=> {
    let token = ''
    let username = ''
    let password = ''
    if (token.length > 0) {
      let xhr = new XMLHttpRequest()
      xhr.open('GET', 'http://localhost:4000/video_info?token=' + token);
      xhr.setRequestHeader('Content-type', 'application/json');
      xhr.onload = function () {
        if (this.status === 200) {
          let res = JSON.parse(this.responseText)
          let url = res['url'];
          setupPlay(url, token)
        }
      }
      xhr.send();
    } else if(username.length > 0 && password.length > 0){
      const dp = new DPlayer({
        container: document.getElementById('video'),
        live: true,
        video: {
          url: 'http://localhost:4000/video/mpd/manifest.mpd',
          type: 'customDash',
          pic: "https://lbsugc.cdn.bcebos.com/images/B649d56d13c63ce869.jpeg",
          customType: {
            customDash: function (video,player) {
              let protData = {
                'com.widevine.alpha': {
                  'serverURL': 'http://localhost:4000/wvproxy/dvserial?contentid=test',
                }
              }
              let dash_player = dashjs.MediaPlayer().create();
              dash_player.initialize(video, video.src, false);
              dash_player.setProtectionData(protData);
              dash_player.on(dashjs.MediaPlayer.events.DEVICEID_REQUEST_COMPLETE, function(data) {
                let deviceId = data.deviceId;
                let xhr = new XMLHttpRequest()
                xhr.open('GET', 'http://localhost:4000/video_info?deviceId=' + deviceId + '&username=' + username + '&password=' + password);
                xhr.setRequestHeader('Content-type', 'application/json');
                xhr.onload = function () {
                  if (this.status === 200) {
                    let res = JSON.parse(this.responseText)
                    let url = res['url'];
                    let token = res['token']
                    setupPlay(url, token)
                  }
                }
                xhr.send();
              }, null);
              player.container.setAttribute("inert","")
              player.controller.hide()
            }
          }
        }
      });
      dp.play();
    }
  }, []);


  return (
    <div className="App">
      <div id="video" className='video'></div>
    </div>
  );
}


export default App;
