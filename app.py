from flask import Flask, request
import requests,json,time,os
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
    video_id = request.args.get("videoId")
    platform = request.args.get("platform")
    if device_id:
        return get_play_url_with_user_info(username,password,device_id,video_id,platform)
    else:
        return get_play_url_with_token(token,video_id,platform)

def get_play_url_with_user_info(username,password,device_id,video_id,platform):
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
    return get_play_url_with_token(token,video_id,platform)
    

def get_play_url_with_token(token,video_id,platform):
    s = requests.session()
    ts = int(round(time.time() * 1000))
    if len(video_id) > 0:
        url = 'https://user-api.mytvsuper.com/v1/video/checkout?platform=%s&video_id=%s' % (platform,video_id)
    else:
        url = 'https://user-api.mytvsuper.com/v1/channel/checkout?platform=%s&network_code=J&ts=%s' %(platform,str(ts))
    check_response = s.get(url,headers={
        'authorization': 'Bearer '+ token
    },proxies=proxies)
    if check_response.status_code != 200:
        return check_response.text,check_response.status_code
    else:
        video_info = json.loads(check_response.text)
        # print(video_info)
        streaming_path = video_info['profiles'][0]['streaming_path']
        content_id = video_info['content_id']
        # # print(streaming_path)
        mpd_url = s.get(streaming_path,verify=False,proxies=proxies, allow_redirects=False).headers['Location']
        # print("mpd:",mpd_url,"token",token,sep='\n')
        res = {
            "url" : mpd_url,
            "token": token,
            "content_id" :content_id
        }
        return json.dumps(res)
    
@app.route("/get_user_info")
def get_user_info_from_local():
    if os.path.exists('./user_info.json'):
        with open('./user_info.json','r') as f:
            user_info = json.load(f)
    return json.dumps(user_info)