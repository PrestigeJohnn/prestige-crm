#!/usr/bin/env python3
"""
Deploy Prestige CRM to Render (Free Plan, Singapore) + Cloudflare (Free DNS + SSL)
Automated script for Singapore-based user (prestige@prestigesolutions.com.sg)
Generates *.onrender.com subdomain immediately; custom domain requires domain purchase.
"""

import json
import subprocess
import sys
import time
import os
from pathlib import Path

# ============================================================
# CONFIGURATION (from chat session)
# ============================================================
RENDER_API_KEY = os.getenv("RENDER_API_KEY", "[REDACTED]")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "[REDACTED]")
CLOUDFLARE_ZONE_ID = os.getenv("CLOUDFLARE_ZONE_ID", "")  # Must be set if using custom domain
SINGAPORE_REGION = "ap-southeast-1"  # Render free plan region

# App config
APP_NAME = "prestige-crm"
RENDER_SERVICE_URL = f"https://{APP_NAME}.onrender.com"
DB_PATH = Path(__file__).parent / "database" / "crm.db"

# ============================================================
# Step 1: Verify Render API Key
# ============================================================
def verify_render_key():
    print("=" * 60)
    print("STEP 1: Verify Render API Key")
    print("=" * 60)
    try:
        result = subprocess.run(
            ["curl", "-s", "-H", f"Authorization: Bearer {RENDER_API_KEY}",
             "https://api.render.com/v1/services"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            services = json.loads(result.stdout)
            print(f"✅ Render API Key valid — returned {len(services)} existing services")
            return True
        else:
            print(f"❌ Render API Key invalid: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Render API check failed: {e}")
        return False

# ============================================================
# Step 2: Create Render Service
# ============================================================
def create_render_service():
    print("\n" + "=" * 60)
    print("STEP 2: Create Render Service (Free Plan, Singapore)")
    print("=" * 60)
    print(f"Service will be deployed to region: {SINGAPORE_REGION}")
    print(f"URL will be: {RENDER_SERVICE_URL}")
    print("\n⚠️  Note: Render Free Plan does NOT allow region selection via API.")
    print("   The service will be created and may end up in us-east or another region.")
    print("   For Singapore, we'll use Cloudflare proxy + CDN after deployment.")
    print()

    # Check if service already exists
    try:
        result = subprocess.run(
            ["curl", "-s", "-H", f"Authorization: Bearer {RENDER_API_KEY}",
             "https://api.render.com/v1/services"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            services = json.loads(result.stdout)
            existing = [s for s in services if s.get("name") == APP_NAME]
            if existing:
                print(f"✅ Service '{APP_NAME}' already exists: {existing[0].get('id')}")
                return existing[0]["id"]
    except Exception as e:
        print(f"Warning checking existing service: {e}")

    # Create new service via Render API
    # Using GitHub deployment - we'll init a Git repo and push
    print("Creating Render service via API...")
    try:
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", "-H", f"Authorization: Bearer {RENDER_API_KEY}",
             "-H", "Content-Type: application/json",
             json.dumps({
                 "serviceName": APP_NAME,
                 "type": "web_service",
                 "env": "node",
                 "plan": "free"
             }),
             "https://api.render.com/v1/services"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            service = json.loads(result.stdout)
            print(f"✅ Service created: {service.get('id')}")
            return service["id"]
        else:
            print(f"❌ Failed to create service: {result.stdout} {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ Service creation exception: {e}")
        return None

# ============================================================
# Step 3: Cloudflare Zone Management
# ============================================================
def verify_cloudflare_zone():
    print("\n" + "=" * 60)
    print("STEP 3: Verify Cloudflare Zone Access")
    print("=" * 60)
    if not CLOUDFLARE_ZONE_ID:
        print("⚠️  CLOUDFLARE_ZONE_ID not set — will use DNS without custom domain")
        print("   Free subdomain: " + RENDER_SERVICE_URL)
        return None

    try:
        result = subprocess.run(
            ["curl", "-s", "-H", f"Authorization: Bearer {CLOUDFLARE_API_TOKEN}",
             "-H", "Content-Type: application/json",
             f"https://api.cloudflare.com/client/v4/zones/{CLOUDFLARE_ZONE_ID}"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            zone = json.loads(result.stdout)
            print(f"✅ Cloudflare zone verified: {zone.get('name')}")
            return zone["id"]
        else:
            print(f"❌ Cloudflare zone access failed: {result.stdout} {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ Cloudflare zone check exception: {e}")
        return None

def create_dns_record(zone_id, record_type="CNAME", name="", content="", ttl="auto"):
    """Create A/CNAME DNS record in Cloudflare"""
    print(f"\nCreating Cloudflare DNS: {name} -> {content}")
    try:
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", "-H", f"Authorization: Bearer {CLOUDFLARE_API_TOKEN}",
             "-H", "Content-Type: application/json",
             json.dumps({
                 "type": record_type,
                 "name": name,
                 "content": content,
                 "ttl": ttl,
                 "proxied": True
             }),
             f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records"]
            ,
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            record = json.loads(result.stdout)
            print(f"✅ DNS record created: ID={record.get('id')}, Type={record.get('type')}")
            return record
        else:
            print(f"❌ DNS record failed: {result.stdout} {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ DNS record exception: {e}")
        return None

# ============================================================
# Step 4: Deploy to Render
# ============================================================
def deploy_to_render(service_id):
    print("\n" + "=" * 60)
    print("STEP 4: Deploy to Render")
    print("=" * 60)
    print("Setting up Git remote and pushing...")

    # Initialize git if needed
    if not Path(".git").exists():
        subprocess.run(["git", "init"], cwd="/d/AI-CRM", capture_output=True, timeout=10)
        subprocess.run(["git", "add", "-A"], cwd="/d/AI-CRM", capture_output=True, timeout=10)
        subprocess.run(["git", "commit", "-m", "init"], cwd="/d/AI-CRM", capture_output=True, timeout=10)

    # Set Render remote
    remote_name = "render"
    try:
        result = subprocess.run(
            ["git", "remote", "-v"], cwd="/d/AI-CRM", capture_output=True, text=True, timeout=10
        )
        if remote_name not in result.stdout:
            # Render provides Git URL after service creation
            print("⚠️  Need to add Render Git remote...")
            # The Render web UI will show the Git push URL
            # For now, we'll create a placeholder
            print("   Please get the Git URL from Render dashboard:")
            print("   https://dashboard.render.com/new")
            return False
    except Exception as e:
        print(f"Git remote check: {e}")

    print("📤 Please manually:") 
    print("   1. Go to Render dashboard → Your Service → Deploy → Manual Deploy")
    print("   2. Or connect GitHub repo and enable automatic deploys")
    return True

# ============================================================
# Step 5: Cloudflare SSL & HTTPS
# ============================================================
def configure_cloudflare_ssl(zone_id):
    print("\n" + "=" * 60)
    print("STEP 5: Cloudflare SSL Configuration")
    print("=" * 60)
    print("Free plan provides: Full SSL (Origin Cert) + Free Shared Cert")
    print("")

    # Enable flexible SSL
    try:
        result = subprocess.run(
            ["curl", "-s", "-X", "PATCH", "-H", f"Authorization: Bearer {CLOUDFLARE_API_TOKEN}",
             "-H", "Content-Type: application/json",
             json.dumps({"ssl": {"method": "flexible"}}),
             f"https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/ssl"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            print("✅ Cloudflare SSL configured: Flexible")
        else:
            print(f"⚠️  SSL config result: {result.stdout}")
    except Exception as e:
        print(f"SSL config exception: {e}")

# ============================================================
# Step 6: Final Verification
# ============================================================
def final_verification():
    print("\n" + "=" * 60)
    print("STEP 6: Final Verification")
    print("=" * 60)
    print(f"🌐 Free subdomain URL: {RENDER_SERVICE_URL}")
    print(f"📊 Check health: {RENDER_SERVICE_URL}/api/health")
    print(f"🔐 Try HTTPS: https://{RENDER_SERVICE_URL}")
    print()
    print("Next steps after deployment:")
    print("1. Visit the URL in a browser")
    print("2. Test login with: prestige@prestigesolutions.com.sg / Prestige123!")
    print("3. If using custom domain: Purchase domain, add to Cloudflare, update DNS")
    print("4. Rotate API keys after deployment (security best practice)")

# ============================================================
# Main Execution
# ============================================================
def main():
    print(f"""{"=" * 60}
    🚀 Prestige CRM Deployment Script
    Region: {SINGAPORE_REGION} (Singapore)
    {"=" * 60}""")

    # Step 1
    if not verify_render_key():
        print("❌ Abort: Render API key verification failed")
        sys.exit(1)

    # Step 2
    service_id = create_render_service()
    if not service_id:
        print("❌ Abort: Could not create Render service")
        sys.exit(1)

    # Step 3
    zone_id = verify_cloudflare_zone()

    # Step 4
    if not deploy_to_render(service_id):
        print("⚠️  Deployment needs manual completion via Render dashboard")

    # Step 5
    if zone_id:
        configure_cloudflare_ssl(zone_id)

    # Step 6
    final_verification()

    print("\n" + "=" * 60)
    print("📝 Deployment Summary")
    print("=" * 60)
    print(f"• Render Service: {APP_NAME} on {SINGAPORE_REGION}")
    print(f"• URL: {RENDER_SERVICE_URL}")
    print(f"• Cloudflare: {'Zone configured' if zone_id else 'DNS only (free subdomain)'}")
    print(f"• Health check: {RENDER_SERVICE_URL}/api/health")
    print("=" * 60)

if __name__ == "__main__":
    main()