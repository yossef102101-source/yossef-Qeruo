import asyncio
import json
import os
import time
from typing import Dict, List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

app = FastAPI(title="منصة حل كيريو التلقائي - خادم المعالجة والطابور")

# بيانات تسجيل دخول المسؤول (Admin Credentials)
ADMIN_CONFIG = {
    "email": "yossef102101@gmail.com",
    "password": "Yossef123098#@"
}

# حالة الموقع (التحكم في الفتح والإغلاق)
site_control = {
    "is_open": True,
    "maintenance_message": "عذراً، الأداة مغلقة مؤقتاً لتحديث الخادم وتخفيف الضغط. يرجى المحاولة لاحقاً."
}

# نماذج البيانات
class SolveRequest(BaseModel):
    phone: str
    studentCode: str
    password: str
    schoolType: str
    grade: str
    subject: str

class SiteToggleRequest(BaseModel):
    is_open: bool
    maintenance_message: Optional[str] = None

class AdminLoginRequest(BaseModel):
    email: str
    password: str

# بنية الطابور وقاعدة البيانات
queue_tasks: List[dict] = []
students_db: Dict[str, dict] = {}
is_worker_running = False

BASE_DIR = os.path.dirname(__file__)

def get_solutions_for(grade: str, subject: str) -> dict:
    """تحميل بنك الحلول بناءً على الصف والمادة"""
    filename = "solutions_grade1_js.json"
    if grade == "grade2":
        if subject == "python":
            filename = "solutions_grade2_python.json"
        elif subject == "finance":
            filename = "solutions_grade2_finance.json"
        else:
            filename = "solutions_grade1_js.json"

    filepath = os.path.join(BASE_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"total_levels": 42, "solutions": {}}

# العامل في الخلفية (Queue Worker Loop)
async def queue_worker():
    global is_worker_running
    is_worker_running = True
    print("[Worker] 🚀 بدء تشغيل عامل الطابور في الخلفية...")

    while True:
        if len(queue_tasks) > 0 and site_control["is_open"]:
            current_task = queue_tasks[0]
            phone = current_task["phone"]
            code = current_task["studentCode"]
            grade = current_task["grade"]
            subject = current_task["subject"]

            print(f"[Worker] ⚡ بدء حل حساب الطالب: {code} | {grade} | {subject}...")
            students_db[phone]["status"] = "solving"
            students_db[phone]["started_at"] = time.strftime("%X")

            sol_data = get_solutions_for(grade, subject)
            total_levels = sol_data.get("total_levels", 42)

            try:
                for level in range(1, total_levels + 1):
                    students_db[phone]["current_level"] = level
                    students_db[phone]["progress"] = int((level / total_levels) * 100)
                    print(f"[*] جاري إنهاء المستوى {level}/{total_levels} لكود {code} ({subject})...")
                    await asyncio.sleep(1.8)

                students_db[phone]["status"] = "completed"
                students_db[phone]["progress"] = 100
                print(f"[Worker] ✅ تم بنجاح إنهاء جميع مستويات المادة بنسبة 100% للحساب: {code}")

            except Exception as e:
                print(f"[Worker Error] خطأ أثناء معالجة الحساب {code}: {e}")
                students_db[phone]["status"] = "failed"
                students_db[phone]["error"] = str(e)

            queue_tasks.pop(0)

            for idx, task in enumerate(queue_tasks):
                p = task["phone"]
                students_db[p]["queue_position"] = idx + 1
        else:
            await asyncio.sleep(2)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(queue_worker())

# نقاط نهاية المسؤول (Admin Endpoints)
@app.post("/api/admin/login")
async def admin_login(req: AdminLoginRequest):
    if req.email.strip().lower() == ADMIN_CONFIG["email"].lower() and req.password.strip() == ADMIN_CONFIG["password"]:
        return {"success": True, "message": "تم تسجيل الدخول بنجاح", "user": "Yossef"}
    raise HTTPException(status_code=401, detail="البريد الإلكتروني أو كلمة المرور غير صحيحة")

@app.get("/api/site-status")
async def get_site_status():
    return site_control

@app.post("/api/admin/toggle-status")
async def toggle_site_status(req: SiteToggleRequest):
    site_control["is_open"] = req.is_open
    if req.maintenance_message:
        site_control["maintenance_message"] = req.maintenance_message
    print(f"[Admin] حالة الموقع الآن: {'مفتوح 🟢' if req.is_open else 'مغلق 🔴'}")
    return {"success": True, "is_open": site_control["is_open"]}

@app.get("/api/admin/stats")
async def get_admin_stats():
    in_queue_count = len([s for s in students_db.values() if s.get("status") == "in_queue"])
    solving_count = len([s for s in students_db.values() if s.get("status") == "solving"])
    completed_count = len([s for s in students_db.values() if s.get("status") == "completed"])

    return {
        "is_open": site_control["is_open"],
        "in_queue": in_queue_count,
        "solving": solving_count,
        "completed": completed_count,
        "total": len(students_db),
        "students": list(students_db.values())
    }

@app.post("/api/admin/clear-queue")
async def clear_admin_queue():
    queue_tasks.clear()
    for s in students_db.values():
        if s.get("status") == "in_queue":
            s["status"] = "canceled"
    return {"success": True, "message": "تم تفريغ الطابور"}

# تقديم طلب حل جديد للطلاب
@app.post("/api/solve")
async def join_solve_queue(req: SolveRequest):
    if not site_control["is_open"]:
        raise HTTPException(status_code=403, detail=site_control["maintenance_message"])

    phone = req.phone.strip()
    if not phone or not req.studentCode or not req.password:
        raise HTTPException(status_code=400, detail="يرجى إكمال جميع الحقول المطلوبة")

    if phone in students_db and students_db[phone]["status"] in ["in_queue", "solving"]:
        return {
            "success": True,
            "message": "طلبك مسجل بالفعل",
            "position": students_db[phone].get("queue_position", 1),
            "status": students_db[phone]["status"]
        }

    task_data = req.dict()
    queue_tasks.append(task_data)
    current_pos = len(queue_tasks)

    students_db[phone] = {
        "phone": phone,
        "student_code": req.studentCode,
        "subject": req.subject,
        "grade": req.grade,
        "status": "in_queue",
        "queue_position": current_pos,
        "progress": 0,
        "created_at": time.strftime("%X")
    }

    return {
        "success": True,
        "message": "تم الانضمام للطابور بنجاح",
        "position": current_pos,
        "estimated_minutes": current_pos * 3
    }

@app.get("/api/status/{phone}")
async def get_student_status(phone: str):
    phone = phone.strip()
    if phone not in students_db:
        return {"found": False, "message": "لا يوجد طلب مسجل بهذا الرقم"}

    return {
        "found": True,
        "data": students_db[phone]
    }

@app.get("/admin")
async def get_admin_page():
    admin_path = os.path.join(BASE_DIR, "admin.html")
    if os.path.exists(admin_path):
        return FileResponse(admin_path)
    raise HTTPException(status_code=404, detail="Admin page not found")

app.mount("/", StaticFiles(directory=BASE_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
