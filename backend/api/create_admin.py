import asyncio
import sys
import getpass
from backend.api.database import async_session
from backend.api.admin.utils import pwd_context
from backend.api.admin.services import create_admin

async def main():
    if len(sys.argv) >= 3:
        email = sys.argv[1]
        password = sys.argv[2]
    else:
        try:
            email = input("Admin email: ").strip()
            password = getpass.getpass("Password: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nCancelled.")
            return
    
    if not email or not password:
        print("Error: Email and password are required")
        sys.exit(1)
    email = email.encode('utf-8', errors='ignore').decode('utf-8')
    hashed_password = pwd_context.hash(password)
    async with async_session() as session:
        await create_admin(session=session, email=email, password_hash=hashed_password)

    print(f"Admin created successfully! Email: {email}")

if __name__ == "__main__":
    asyncio.run(main())


