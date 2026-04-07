import subprocess
import json
import os

PLAYLISTS = [
    {
        "id": "sql-course",
        "title": "SQL Course",
        "description": "Master SQL Database querying and management.",
        "image": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=250&fit=crop",
        "url": "https://youtube.com/playlist?list=PLNcg_FV9n7qZY_2eAtUzEUulNjTJREhQe"
    },
    {
        "id": "tableau-course",
        "title": "Tableau Course",
        "description": "Visualize data like a pro with Tableau.",
        "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
        "url": "https://youtube.com/playlist?list=PLNcg_FV9n7qZJqrKcUUCWCWPYCrlcVm9v"
    },
    {
        "id": "python-course",
        "title": "Python Course",
        "description": "Learn Python programming starting from scratch.",
        "image": "https://images.unsplash.com/photo-1526379095098-d400fd0bfce8?w=400&h=250&fit=crop",
        "url": "https://youtube.com/playlist?list=PLNcg_FV9n7qZGfFl2ANI_zISzNp257Lwn"
    },
    {
        "id": "powerbi-course",
        "title": "Power BI Course",
        "description": "Build dynamic dashboards using Power BI.",
        "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
        "url": "https://youtube.com/playlist?list=PLNcg_FV9n7qZge4KDGqGtqgiuVuhVZWzu"
    }
]

def fetch_playlist(playlist_url):
    cmd = ["python", "-m", "yt_dlp", "-J", "--flat-playlist", playlist_url]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error fetching {playlist_url}:\n{result.stderr}")
        return []
    
    data = json.loads(result.stdout)
    entries = data.get("entries", [])
    
    modules = []
    for idx, entry in enumerate(entries):
        # We need video ID and title.
        title = entry.get("title", f"Video {idx+1}")
        video_id = entry.get("id", "")
        
        # Skip [Private video] or [Deleted video]
        if "[Private video]" in title or "[Deleted video]" in title:
            continue
            
        modules.append({
            "id": f"vid-{video_id}",
            "title": title,
            "description": f"Learn {title}",
            "videoId": video_id
        })
        
    return modules

def main():
    final_courses = []
    for p in PLAYLISTS:
        print(f"Fetching {p['title']}...")
        modules = fetch_playlist(p["url"])
        
        # REMOVE THE FIRST VIDEO
        if len(modules) > 0:
            modules = modules[1:]
            
        final_courses.append({
            "id": p["id"],
            "title": p["title"],
            "description": p["description"],
            "image": p["image"],
            "modules": modules
        })
        
    # Write to courses_data.py
    out_path = os.path.join(os.path.dirname(__file__), "courses_data.py")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("# Automatically generated courses data\\n")
        f.write("COURSES = " + json.dumps(final_courses, indent=4))
    
    print(f"Generated courses_data.py with {len(final_courses)} courses.")

if __name__ == "__main__":
    main()
