# Step1 - Backend Bouldering Video Pose Analysis Demo

你是一个资深后端工程师 + 计算机视觉工程师。请帮我构建一个 **Backend Bouldering Video（抱石视频）姿态分析 Demo**。 目标是实现一个可运行、结构清晰、可扩展的后端系统的demo


## 该阶段目标

构建一个后端服务，实现以下流程： 用户上传抱石视频 → 后端逐帧处理 → 使用 OpenCV + OpenPose 进行姿态检测 → 生成带骨架可视化视频 + 关键点 JSON → 提供 API 下载结果。


## 功能需求

### 1 视频输入

- 支持通过 HTTP API 上传视频文件（mp4/mov）
- 视频保存至：`data/uploads/`
- 支持本地路径输入（用于开发调试模式）

### 2 姿态检测与可视化

- 使用 OpenCV 读取视频帧
- 使用 OpenPose 进行人体关键点检测
- 如果 OpenPose 安装困难，可提供 fallback（如 MediaPipe Pose），但架构必须允许之后替换为真正 OpenPose

输出两种结果：

#### A) 关键点 JSON

每帧包含：

- `frame_index`
- `keypoints`
- `confidence`
- `bbox`（可选）
- 支持 COCO 格式或自定义结构

保存路径：

data/outputs/{video_id}/keypoints.json


#### B) 可视化视频

- 在原视频上绘制 skeleton（骨架线 + 关键点）
- 输出 mp4 视频

保存路径：

data/outputs/{video_id}/overlay.mp4


### 3 可扩展模型结构（重点）

检测方法必须放在独立模块目录中，方便未来扩展（如动作识别、角度分析、抓点检测等）。

需要设计统一接口：

```python
class BasePoseModel:
    def load_model(self):
        pass

    def infer(self, frame) -> PoseResult:
        pass

    def visualize(self, frame, pose_result) -> frame:
        pass
```

推荐目录结构:

```
app/
│
├── main.py
├── config.py
│
├── api/
│   └── routes.py
│
├── models/
│   ├── base_model.py
│   ├── pose/
│   │   ├── openpose_model.py
│   │   └── mediapipe_model.py
│   └── registry.py
│
├── pipelines/
│   └── video_processor.py
│
├── schemas/
│   └── pose.py
│
├── services/
│   └── job_manager.py
│
data/
├── uploads/
└── outputs/
```
### 4 API 设计（FastAPI）

必须使用 FastAPI 实现 REST API。

接口要求：

```
方法	路径	说明
POST	/videos/upload	上传视频，返回 video_id
POST	/videos/{video_id}/process?model=openpose	启动处理任务
GET	/jobs/{job_id}	查询任务状态
GET	/videos/{video_id}/results	返回结果文件列表
GET	/videos/{video_id}/download?type=overlay	下载可视化视频
GET	/videos/{video_id}/download?type=keypoints	下载 JSON
```

### 配置要求

支持以下可配置项：

1. 模型选择（openpose | mediapipe）
2. 是否跳帧处理（every_n_frames）
3. 输出分辨率
4. 是否保存中间帧
5. 最大视频长度限制

### 可扩展要求

必须支持未来添加：

新姿态模型
动作分类模块
关节角度分析模块
抓点识别模块

并且：
使用 registry 或 factory pattern
不允许在 pipeline 中硬编码模型类型

---

## Stage1 已实现内容（当前代码状态）

以下内容已在后端代码中落地（基于 `backend/src/app`）：

### 1) API 与路由

- 已新增视频与任务接口：
  - `POST /videos/upload`
  - `POST /videos/{video_id}/process?model=openpose`
  - `POST /videos/process-local`（开发调试：本地路径输入）
  - `GET /jobs/{job_id}`
  - `GET /videos/{video_id}/results`
  - `GET /videos/{video_id}/download?type=overlay`
  - `GET /videos/{video_id}/download?type=keypoints`
- 同时保留 `/api/v1` 前缀版本（例如 `/api/v1/videos/upload`），便于前后兼容。

### 2) 可扩展模型架构

- 已实现统一抽象接口：
  - `app/models/base_model.py` 中 `BasePoseModel`
- 已实现 registry/factory：
  - `app/models/registry.py` 中 `PoseModelRegistry`
  - 当前注册模型：`openpose`、`mediapipe`
- 已实现模型模块：
  - `app/models/pose/openpose_model.py`：OpenPose 适配器（当前委托到 fallback）
  - `app/models/pose/mediapipe_model.py`：MediaPipe 推理 + 骨架可视化

### 3) 视频处理 Pipeline

- `app/pipelines/video_processor.py` 已实现：
  - OpenCV 逐帧读取
  - `every_n_frames` 跳帧推理
  - 输出分辨率控制（`original` 或 `WxH`）
  - 骨架叠加视频输出
  - 关键点 JSON 输出
  - 视频长度限制校验（秒）
  - 可选保存中间帧
- 输出路径：
  - `data/outputs/{video_id}/overlay.mp4`
  - `data/outputs/{video_id}/keypoints.json`
  - 可选：`data/outputs/{video_id}/frames/`

### 4) Job 管理与异步处理

- `app/services/job_manager.py` 已实现：
  - 上传文件保存（`data/uploads`）
  - 本地文件复制注册（dev 模式）
  - 后台线程异步处理任务
  - 任务状态：`pending/running/completed/failed`
  - 结果文件索引与下载路径解析

### 5) 配置与依赖

- 配置项已接入（`.env` / `.env.example`）：
  - `POSE_DEFAULT_MODEL`
  - `POSE_EVERY_N_FRAMES`
  - `POSE_OUTPUT_RESOLUTION`
  - `POSE_SAVE_INTERMEDIATE_FRAMES`
  - `POSE_MAX_VIDEO_SECONDS`
  - `DATA_ROOT` / `UPLOADS_DIRNAME` / `OUTPUTS_DIRNAME`
- `backend/pyproject.toml` 已补充：
  - `python-multipart`
  - `numpy`
  - `opencv-python-headless`
  - 可选 `pose` extra：`mediapipe`

---

## 使用说明（Runbook）

### 1) 安装依赖

在仓库根目录执行：

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
# 如需 MediaPipe
pip install -e ".[pose]"
```

### 2) 启动服务

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

健康检查：

- `GET http://127.0.0.1:8000/health`
- Swagger: `http://127.0.0.1:8000/docs`

### 3) 标准 API 调用流程（HTTP 上传）

1. 上传视频

```bash
curl -X POST "http://127.0.0.1:8000/videos/upload" \
  -F "file=@/absolute/path/demo.mp4"
```

返回示例：

```json
{"video_id":"a1b2c3d4e5f6","filename":"demo.mp4"}
```

2. 启动处理任务

```bash
curl -X POST "http://127.0.0.1:8000/videos/a1b2c3d4e5f6/process?model=openpose" \
  -H "Content-Type: application/json" \
  -d '{"every_n_frames":1,"output_resolution":"original","save_intermediate_frames":false}'
```

3. 轮询任务状态

```bash
curl "http://127.0.0.1:8000/jobs/<job_id>"
```

4. 查询结果文件

```bash
curl "http://127.0.0.1:8000/videos/a1b2c3d4e5f6/results"
```

5. 下载结果

```bash
curl -L "http://127.0.0.1:8000/videos/a1b2c3d4e5f6/download?type=overlay" -o overlay.mp4
curl -L "http://127.0.0.1:8000/videos/a1b2c3d4e5f6/download?type=keypoints" -o keypoints.json
```

### 4) 本地路径调试模式（不走上传）

```bash
curl -X POST "http://127.0.0.1:8000/videos/process-local" \
  -H "Content-Type: application/json" \
  -d '{
    "local_path":"/absolute/path/demo.mp4",
    "model":"mediapipe",
    "every_n_frames":2,
    "output_resolution":"1280x720",
    "save_intermediate_frames":true
  }'
```

---

## Debug 方法（常见问题排查）

### 1) 启动即报导入错误

- 现象：`ModuleNotFoundError: No module named app`
- 排查：
  - 必须在 `backend/` 目录运行
  - 确认执行过 `pip install -e .`
  - 确认已激活 `.venv`

### 2) 上传报 400（文件类型）

- 现象：`Only .mp4 and .mov are supported`
- 排查：
  - 文件后缀必须是 `.mp4` 或 `.mov`
  - 注意大小写与真实文件名后缀

### 3) 处理任务失败（job status = failed）

- 排查顺序：
  1. `GET /jobs/{job_id}` 查看 `error` 字段
  2. 检查输入视频是否损坏（OpenCV 无法打开）
  3. 检查视频长度是否超过 `POSE_MAX_VIDEO_SECONDS`
  4. 检查 `output_resolution` 是否合法（`original` 或 `数字x数字`）
  5. 检查磁盘空间与 `data/outputs` 写权限

### 4) Mediapipe 不可用

- 现象：环境未安装 mediapipe
- 当前行为：
  - `openpose` 适配器内部会走 fallback 逻辑
  - `mediapipe` 模型不可导入时会退化为启发式关键点（demo 用）
- 建议：
  - 安装 `pip install -e ".[pose]"`
  - 再次处理同一视频验证关键点质量

### 5) 无法下载结果文件

- 现象：`Requested result file does not exist`
- 排查：
  - 先确认任务已 `completed`
  - 再调 `GET /videos/{video_id}/results` 看是否存在 `overlay` / `keypoints`
  - 下载参数必须是 `type=overlay` 或 `type=keypoints`

### 6) 性能调优建议（开发期）

- 大视频先用：
  - `every_n_frames=2/3/4` 降低推理频率
  - `output_resolution=960x540` 降低像素负载
  - `save_intermediate_frames=false` 减少 IO
- 线上化前建议将后台线程任务迁移到专业任务队列（如 Celery/RQ）。
