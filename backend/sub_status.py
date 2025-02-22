import requests
import json
import pandas as pd
import time

contest_name = "fe-contest-online-2024"

cookies = {
    "_zitok": "adf81d713726aa1c3b611708621880",
    "hackerrank_mixpanel_token": "fe22854e-d8e6-41f0-b5cf-1404c9d40005",
    "_biz_uid": "b53871a3da544599cb5a2a696b568fd0",
    "__utmz": "74197771.1739107638.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)",
    "_gcl_au": "1.1.654101726.1739107641",
    "referrer": "https://www.hackerrank.com/contests",
    "_mkto_trk": "id:487-WAY-049&token:_mch-hackerrank.com-ded68b69cfe6c9716d144023f779dd05",
    "session_referrer": "https%3A%2F%2Fwww.google.com%2F",
    "session_referring_domain": "www.google.com",
    "user_type": "hacker",
    "cebs": "1",
    "_ga": "GA1.1.91457237.1739107638",
    "_ga_BCP376TP8D": "GS1.1.1740205225.2.0.1740205225.0.0.0",
    "_ga_R0S46VQSNQ": "GS1.1.1740205226.2.0.1740205226.60.0.0",
    "fileDownload": "true",
    "hackerrankx_mixpanel_token": "fe22854e-d8e6-41f0-b5cf-1404c9d40005",
    "_fbp": "fb.1.1740205239543.95424279624060765",
    "session_landing_url": "https%3A%2F%2Fwww.hackerrank.com%2Fprefetch_data%3Fcontest_slug%3Dmaster%26get_feature_feedback_list%3Dtrue",
    "remember_hacker_token": "eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaGJDRnNHYVFSU2xub0JTU0lpSkRKaEpERXdKR0kxUTAwM2NVazBaakpJT1ZkUVdHSnBPRTl1WVhVR09nWkZWRWtpRlRFM05EQXlNRFUyTURNdU5Ua3pORGtHT3dCRyIsImV4cCI6IjIwMjUtMDMtMDhUMDY6MjY6NDMuNTkzWiIsInB1ciI6bnVsbH19--b8811995b46198194d14f38dd10ee707e687abb7",
    "metrics_user_identifier": "17a9652-517ef9b7fa7e0163100b2176e53357b9da630bbc",
    "_hrank_session": "f6ffc1d3142e0007ef7ee78e18d1521e",
    "user_theme": "dark",
    "session_id": "0yqqgbsu-1740205609707",
    "__utma": "74197771.91457237.1739107638.1739107638.1740205612.2",
    "__utmc": "74197771",
    "web_browser_id": "aa738e402a4f6b1cb5af8d9c82a87613",
    "optimizelyEndUserId": "oeu1740205736407r0.27401401760738997",
    "_uetsid": "1ab331b0f0e511efbb5195ebf97fa11f",
    "_uetvid": "fcbacd908efa11ef926e2139b1f392d7",
    "_ga_X2HP4BPSD7": "GS1.1.1740205225.2.1.1740205870.0.0.0",
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en",
    "Cache-Control": "max-age=0",
    "DNT": "1",
    "Upgrade-Insecure-Requests": "1",
}

params = {
    "limit": 1500,
    "offset": 0,
}

url = f"https://www.hackerrank.com/rest/contests/{contest_name}/judge_submissions"

while(True):
    response = requests.get(url, headers=headers, cookies=cookies, params=params)
    a = response.json()
    # with open("sub_status.json", "w") as f:
    #     json.dump(a, f, indent=4)
    submissions = a['models']
    filtered_submissions = []
    for submission in submissions:
        if submission['status'] != "Accepted":
            continue
        filtered_submission = {
            "id": submission['id'],
            "hacker_id": submission['hacker_id'],
            "hacker_username": submission['hacker_username'],
            "status": submission['status'],
            "created_at": submission['created_at'],
            "time_from_start": submission['time_from_start'],
            "language": submission['language'],
            "challenge": submission['challenge']['name'],
            "Balloon": 'No'
        }
        filtered_submissions.append(filtered_submission)
    # with open("sub_status.json", "w") as f:
    #     json.dump(filtered_submissions, f, indent=4)  

    requests.post("http://127.0.0.1:5000/submissions/receive-submissions", json=filtered_submissions)
    time.sleep(10)