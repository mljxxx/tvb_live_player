from flask import Flask, request
import requests,json,time
from urllib3.contrib import pyopenssl
pyopenssl.inject_into_urllib3()
proxies = {
    'http': 'http://127.0.0.1:7891',
    'https': 'http://127.0.0.1:7891'
}

app = Flask(__name__)

@app.route("/video_info")
def get_video_info():
    device_id = request.args.get("deviceId")
    username = request.args.get("username")
    password = request.args.get("password")
    token = request.args.get("token")
    if device_id:
        return get_play_url_with_user_info(username,password,device_id)
    else:
        return get_play_url_with_token(token)

def get_play_url_with_user_info(username,password,device_id):
    s = requests.session()
    s.post(
        'https://www.mytvsuper.com/api/auth/login/',
        {
            "id":username,
            "password":password
        }
    )
    profile = s.post('https://www.mytvsuper.com/api/profile/getProfileList/').text
    profile = json.loads(profile)['profiles'][0]
    s.post('https://www.mytvsuper.com/api/auth/pairDevice/',data={
        "device_id": device_id,
        "lang": "tc",
        "profile_id": profile['id'],
        "profile_name": profile['profile_name'],
        "profile_class": profile['profile_class']
    })
    user_info = s.get(
        'https://www.mytvsuper.com/api/auth/getSession/self/'
    ).text
    user_info = json.loads(user_info)
    # print(user_info)
    token = user_info['user']['token']
    # print(token)
    return get_play_url_with_token(token)
    

def get_play_url_with_token(token):
    s = requests.session()
    ts = int(round(time.time() * 1000))
    check_response = s.get('https://user-api.mytvsuper.com/v1/channel/checkout?platform=web&network_code=J&ts='+str(ts),headers={
        'authorization': 'Bearer '+ token
    },proxies=proxies)
    if check_response.status_code != 200:
        return check_response.text,check_response.status_code
    else:
        video_info = json.loads(check_response.text)
        # print(video_info)
        streaming_path = video_info['profiles'][0]['streaming_path']
        # # print(streaming_path)
        mpd_url = s.get(streaming_path,verify=False,proxies=proxies, allow_redirects=False).headers['Location']
        # print("mpd:",mpd_url,"token",token,sep='\n')
        res = {
            "url" : mpd_url,
            "token": token
        }
        return json.dumps(res)
