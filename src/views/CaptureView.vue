<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Capture Document</h1>
        <p class="page-subtitle">Take a photo or upload document images</p>
      </div>
      <div class="online-indicator" :class="isOnline ? 'online' : 'offline'">
        <span class="dot"></span>
        {{ isOnline ? 'Online' : 'Offline — queuing' }}
      </div>
    </div>

    <div class="capture-grid">
      <!-- Camera / Single capture -->
      <div class="card capture-card">
        <div class="section-title" style="margin-bottom:16px;">Single Capture</div>

        <!-- Live camera stream -->
        <div v-if="cameraActive" class="camera-live">
          <video ref="videoEl" autoplay playsinline class="camera-video"></video>
          <div class="camera-controls">
            <button class="btn btn-ghost btn-sm" @click="stopCamera">Cancel</button>
            <button class="btn btn-accent" @click="captureFrame">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              Capture
            </button>
          </div>
        </div>

        <!-- Preview after capture -->
        <div v-else-if="capturedImage" class="preview-area">
          <img :src="capturedImage" alt="Captured" class="preview-img" />
          <div class="preview-actions">
            <button class="btn btn-ghost btn-sm" @click="retake">Retake</button>
            <button class="btn btn-accent btn-sm" @click="submitCapture">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Submit
            </button>
          </div>
        </div>

        <!-- Idle state -->
        <div v-else class="camera-area">
          <button class="btn btn-primary" @click="openCamera">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Take Photo
          </button>

          <span class="or-divider">or</span>

          <!-- File select — no capture attribute, always opens file explorer -->
          <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="onFileSelect" />
          <button class="btn btn-ghost" @click="fileInput?.click()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Select Image
          </button>

          <p v-if="cameraError" class="cam-error">{{ cameraError }}</p>
        </div>
      </div>

      <!-- Batch upload -->
      <div class="card capture-card">
        <div class="section-title" style="margin-bottom:16px;">Batch Upload</div>

        <div
          class="dropzone"
          :class="{ dragging }"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
        >
          <input type="file" ref="batchInput" accept="image/*,application/pdf" multiple style="display:none" @change="onBatch" />
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-3)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <p class="dz-text">Drop files here</p>
          <p class="text-muted text-sm">JPG, PNG, PDF supported</p>
          <button class="btn btn-ghost btn-sm" @click="batchInput?.click()">Browse Files</button>
        </div>

        <button
          v-if="store.uploadQueue.filter(i => i.status === 'queued' || i.status === 'uploading').length"
          class="btn btn-accent"
          style="width:100%; justify-content:center; margin-top:14px;"
          @click="store.processQueue()"
          :disabled="store.loading"
        >
          {{ store.loading ? 'Uploading...' : `Upload ${store.uploadQueue.filter(i => i.status === 'queued').length} File(s)` }}
        </button>
      </div>
    </div>

    <UploadQueue />

    <div class="card tips" style="margin-top:24px;">
      <div class="section-title" style="margin-bottom:10px;">Capture Tips</div>
      <ul class="tips-list">
        <li>Ensure document is fully visible with no cut edges</li>
        <li>Good lighting — avoid shadows across text</li>
        <li>Hold camera steady, capture will auto-process OCR</li>
        <li>Offline captures are queued and auto-synced when online</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'
import UploadQueue from '../components/UploadQueue.vue'

const store = useAppStore()

const videoEl      = ref(null)
const fileInput    = ref(null)
const batchInput   = ref(null)
const capturedImage = ref(null)
const cameraActive  = ref(false)
const cameraError   = ref('')
const dragging      = ref(false)
const isOnline      = ref(navigator.onLine)

let stream = null

window.addEventListener('online',  () => { isOnline.value = true })
window.addEventListener('offline', () => { isOnline.value = false })

async function openCamera() {
  cameraError.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    })
    cameraActive.value = true
    // videoEl is rendered after cameraActive flips — wait a tick
    await new Promise(r => setTimeout(r, 50))
    if (videoEl.value) videoEl.value.srcObject = stream
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      cameraError.value = 'Camera permission denied. Allow camera access in browser settings.'
    } else if (err.name === 'NotFoundError') {
      cameraError.value = 'No camera found. Use "Select Image" instead.'
    } else {
      cameraError.value = `Camera unavailable: ${err.message}`
    }
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
  cameraActive.value = false
}

function captureFrame() {
  if (!videoEl.value) return
  const video = videoEl.value
  const canvas = document.createElement('canvas')
  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  capturedImage.value = canvas.toDataURL('image/jpeg', 0.92)
  stopCamera()
}

function retake() {
  capturedImage.value = null
  cameraError.value = ''
}

function submitCapture() {
  if (!capturedImage.value) return
  // Convert canvas data to blob and add to queue
  fetch(capturedImage.value)
    .then(res => res.blob())
    .then(blob => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
      store.uploadDocument(file)
      capturedImage.value = null
    })
}

function onFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) {
    store.uploadDocument(file)
    capturedImage.value = null
  }
}

function onBatch(e) {
  Array.from(e.target.files || []).forEach(f => store.uploadDocument(f))
}

function onDrop(e) {
  dragging.value = false
  Array.from(e.dataTransfer.files || []).forEach(f => store.uploadDocument(f))
}

onUnmounted(() => stopCamera())
</script>

<style scoped>
.capture-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 700px) { .capture-grid { grid-template-columns: 1fr; } }

.capture-card { display: flex; flex-direction: column; }

/* Idle state */
.camera-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 20px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
}
.or-divider { font-size: 12px; color: var(--text-3); }

/* Live camera */
.camera-live { display: flex; flex-direction: column; gap: 12px; }

.camera-video {
  display: block;
  width: 100%;
  max-height: min(65vh, 420px);
  border-radius: var(--radius-sm);
  background: #000;
  object-fit: contain;
}

.camera-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Preview */
.preview-area { display: flex; flex-direction: column; gap: 12px; }

.preview-img {
  display: block;
  width: 100%;
  max-height: min(65vh, 420px);
  object-fit: contain;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
}

.preview-actions { display: flex; justify-content: flex-end; gap: 8px; }

.cam-error {
  font-size: 12px;
  color: var(--error);
  background: var(--error-bg);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  text-align: center;
  width: 100%;
}

/* Dropzone */
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 20px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  transition: background 0.15s, border-color 0.15s;
  text-align: center;
}
.dropzone.dragging { background: var(--accent-bg); border-color: var(--accent); }
.dz-text { font-size: 13px; font-weight: 500; color: var(--text-2); margin-top: 4px; }

/* Online badge */
.online-indicator {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 100px;
  border: 1px solid var(--border);
}
.online-indicator .dot { width: 7px; height: 7px; border-radius: 50%; }
.online  { color: var(--success); } .online  .dot { background: var(--success); }
.offline { color: var(--warning); } .offline .dot { background: var(--warning); }

.tips-list { display: flex; flex-direction: column; gap: 6px; padding-left: 18px; }
.tips-list li { font-size: 13px; color: var(--text-2); }

@media (max-width: 520px) {
  .online-indicator {
    width: 100%;
    justify-content: center;
  }

  .camera-area,
  .dropzone {
    padding: 24px 14px;
  }

  .camera-video,
  .preview-img {
    max-height: 70vh;
  }

  .camera-controls,
  .preview-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .camera-controls .btn,
  .preview-actions .btn {
    justify-content: center;
  }
}
</style>
