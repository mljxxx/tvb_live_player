import json,requests,os


def print_episode_info():
    programme_id = '110561'
    programme_details_url = 'https://content-api.mytvsuper.com/v1/programme/details?programme_id='+programme_id+'&platform=web'
    programme_details = requests.get(programme_details_url).text
    programme_details = json.loads(programme_details)
    episode_groups = programme_details['episode_groups']
    latest_group = episode_groups[0]
    start_episode_no = latest_group['start_episode_no']
    end_episode_no = latest_group['end_episode_no']
    episode_list_url = 'https://content-api.mytvsuper.com/v1/episode/list?programme_id=%s&start_episode_no=%s&end_episode_no=%s&sort_desc=true&platform=web' % (programme_id,str(int(end_episode_no)-7),end_episode_no)
    episode_list = requests.get(episode_list_url).text
    episode_list = json.loads(episode_list)
    for item in episode_list['items']:
        print('episode_no:',item['episode_no'],'name:',item['name_tc'],'video_id:',item['video_id'])

if __name__ == '__main__':
    print_episode_info()
