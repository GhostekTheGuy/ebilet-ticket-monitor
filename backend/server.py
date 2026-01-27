"""
Simple Flask server to proxy eBilet API requests.
Run this alongside the Next.js app to bypass captcha protection.

To get the cookie:
1. Open https://sklep.ebilet.pl in your browser
2. Solve the captcha if shown
3. Open DevTools (F12) -> Application -> Cookies
4. Copy the 'wdctx' cookie value
5. Create a file 'cookie.txt' with the cookie value, or set EBILET_COOKIE env var
"""

from flask import Flask, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# Configuration
EVENT_ID = "218143106950758457"
API_URL = "https://sklep.ebilet.pl/api/event/getsectorfreeseatscount"
API_PARAMS = {
    "eid": EVENT_ID,
    "sids": '{"334:335:336":[696,697,698,699,560,582,595,596,597,598,583,584,585,586,701,587,588,589,590,621,599,600,601,602,606,676,677,678,679,692,693,700,682,683,685,688,689,690,686,695,681,691,674,675,694]}',
    "ec": "null",
    "exid": "",
    "tid": "0"
}

def get_cookie():
    """Get the wdctx cookie from file or environment variable"""
    # Try environment variable first
    cookie = os.environ.get('EBILET_COOKIE', '')
    if cookie:
        return cookie

    # Try cookie.txt file
    cookie_file = os.path.join(os.path.dirname(__file__), 'cookie.txt')
    if os.path.exists(cookie_file):
        with open(cookie_file, 'r') as f:
            return f.read().strip()

    return ''


@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    """Fetch ticket data from eBilet API"""
    try:
        cookie = get_cookie()
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
        }

        cookies = {}
        if cookie:
            cookies['wdctx'] = cookie
            print(f"[eBilet] Using cookie: {cookie[:20]}...")
        else:
            print("[eBilet] WARNING: No cookie found. Create backend/cookie.txt with your wdctx cookie value.")

        response = requests.get(
            API_URL,
            params=API_PARAMS,
            timeout=10,
            headers=headers,
            cookies=cookies
        )

        # Check if we got a captcha response
        if response.status_code == 429 or 'allegrocaptcha' in response.text.lower():
            print("[eBilet] Got captcha response. Need to update cookie.")
            print("[eBilet] Visit https://sklep.ebilet.pl in browser, solve captcha, copy wdctx cookie to backend/cookie.txt")
            return jsonify({
                "error": "Captcha required. Update cookie.txt with fresh wdctx cookie from browser.",
                "code": "CAPTCHA_REQUIRED"
            }), 429

        response.raise_for_status()
        data = response.json()
        print(f"[eBilet] Success! Got {len(data.get('sfc', {}))} sectors")
        return jsonify(data)

    except requests.exceptions.HTTPError as e:
        print(f"[eBilet] HTTP Error: {e}")
        if e.response.status_code == 429:
            return jsonify({
                "error": "Rate limited. Update cookie.txt with fresh wdctx cookie from browser.",
                "code": "CAPTCHA_REQUIRED"
            }), 429
        return jsonify({"error": str(e)}), 500
    except requests.exceptions.RequestException as e:
        print(f"[eBilet] Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    cookie = get_cookie()
    return jsonify({
        "status": "ok",
        "has_cookie": bool(cookie)
    })


if __name__ == '__main__':
    print("=" * 60)
    print("  eBilet Proxy Server")
    print("=" * 60)

    cookie = get_cookie()
    if cookie:
        print(f"  Cookie found: {cookie[:30]}...")
    else:
        print("  WARNING: No cookie found!")
        print("  ")
        print("  To fix:")
        print("  1. Open https://sklep.ebilet.pl in your browser")
        print("  2. Solve the captcha if shown")
        print("  3. Open DevTools (F12) -> Application -> Cookies")
        print("  4. Find the 'wdctx' cookie and copy its value")
        print("  5. Save it to: backend/cookie.txt")

    print("=" * 60)
    print("  Server running on http://localhost:5000")
    print("=" * 60)

    app.run(host='0.0.0.0', port=5000, debug=True)
