<script setup lang="ts">
definePageMeta({ layout: false })

import Shell from '~/components/Shell.vue'
import DataTable from '~/components/DataTable.vue'
import Modal from '~/components/Modal.vue'
import Preloading from '~/components/Preloading.vue'

const { get, post, put, del } = useApi()
const config = useRuntimeConfig()
const API_BASE = (config.public?.apiBase || '/api').replace(/\/$/, '') // เช่น http://localhost:8080/api

/* ---------- ตาราง ---------- */
const q = ref('')
const searchText = ref('')
const page = ref(1)
const limit = ref(10)
const loading = ref(true)
const errMsg = ref('')

const items = ref<any[]>([])
const total = ref(0)

const categories = ref<any[]>([])
const categoryFilter = ref<string>('')

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))
const canPrev = computed(() => page.value > 1 && !loading.value)
const canNext = computed(() => page.value < pageCount.value && !loading.value)

/* ---------- ฟอร์ม Add/Edit ---------- */
const showForm = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const submitted = ref(false)

type ProdForm = {
  _id: string
  name: string
  price: number | string
  stock: number | string
  categoryId: string
  imageUrl: string
}
const form = reactive<ProdForm>({ _id: '', name: '', price: '', stock: 0, categoryId: '', imageUrl: '' })
type ProdErrors = Partial<Record<keyof ProdForm, string>>
const errors = reactive<ProdErrors>({})

// ไฟล์ที่เลือก & preview
const imageFile = ref<File | null>(null)
const imagePreview = ref<string>('')

function resetForm() {
  Object.assign(form, { _id: '', name: '', price: '', stock: 0, categoryId: '', imageUrl: '' })
  Object.keys(errors).forEach(k => (errors as any)[k] = '')
  submitted.value = false
  imageFile.value = null
  imagePreview.value = ''
}

/* ---------- View Details Modal ---------- */
const showView = ref(false)
const viewRow = ref<any>(null)
function openView(row:any) {
  viewRow.value = row
  showView.value = true
}

/* ---------- Validate ---------- */
function validateField(key: keyof ProdForm) {
  errors[key] = ''
  if (key === 'name') {
    if (!form.name.trim()) errors.name = 'กรุณากรอกชื่อสินค้า'
    else if (form.name.trim().length < 2) errors.name = 'ต้องยาวอย่างน้อย 2 ตัวอักษร'
  }
  if (key === 'price') {
    const v = Number(form.price)
    if (form.price === '' || Number.isNaN(v)) errors.price = 'กรุณากรอกราคาเป็นตัวเลข'
    else if (v < 0) errors.price = 'ราคาต้องไม่ติดลบ'
  }
  if (key === 'stock') {
    const v = Number(form.stock)
    if (form.stock === '' || Number.isNaN(v)) errors.stock = 'กรุณากรอกสต๊อกเป็นตัวเลข'
    else if (!Number.isInteger(v) || v < 0) errors.stock = 'สต๊อกต้องเป็นจำนวนเต็มไม่ติดลบ'
  }
  if (key === 'categoryId') {
    if (!form.categoryId) errors.categoryId = 'กรุณาเลือกหมวดหมู่'
  }
}
function validateAll() {
  (['name','price','stock','categoryId'] as (keyof ProdForm)[]).forEach(validateField)
  return !errors.name && !errors.price && !errors.stock && !errors.categoryId
}

/* ---------- Data ---------- */
async function fetchCategories() {
  try {
    const res: any = await get('/categories', { page: 1, limit: 999 })
    categories.value = res?.items ?? []
  } catch {}
}

async function fetchProducts(opts: { setLoading?: boolean } = {}) {
  const setLoading = opts.setLoading ?? true
  if (setLoading) loading.value = true
  errMsg.value = ''
  try {
    const params: Record<string, any> = {
      page: page.value,
      limit: limit.value,
      q: searchText.value || ''
    }
    if (categoryFilter.value) params.categoryId = categoryFilter.value

    const res: any = await get('/products', params)
    let list = res?.items ?? []
    total.value = res?.total ?? 0

    // fallback filter by categoryId (กรณี backend ยังไม่รองรับ)
    if (categoryFilter.value) {
      const id = categoryFilter.value
      list = list.filter((r:any) => (r?.categoryId?._id || r?.categoryId) === id)
      total.value = list.length
    }

    items.value = list

    const pc = Math.max(1, Math.ceil(total.value / limit.value))
    if (items.value.length === 0 && page.value > pc) {
      page.value = pc
      await fetchProducts({ setLoading })
    }
  } catch (e:any) {
    console.error(e)
    errMsg.value = e?.data?.message || e?.message || 'Failed to load products'
    items.value = []
    total.value = 0
  } finally {
    if (setLoading) loading.value = false
  }
}

/* ---------- Upload ---------- */
async function uploadImageIfNeeded(): Promise<string> {
  // ถ้าไม่ได้เลือกไฟล์ใหม่ ให้คืนค่า imageUrl เดิม
  if (!imageFile.value) return form.imageUrl || ''

  const fd = new FormData()
  fd.append('file', imageFile.value)

  // ใช้ native fetch ตรง เพื่อส่ง FormData
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  // data.url จะเป็น path เช่น /uploads/xxx.jpg
  // ถ้าต้องการ absolute URL ให้แปลงต่อเอง (เช่น `${window.location.origin}${data.url}`)
  return data.url
}

/* ---------- Actions ---------- */
function applySearch() { page.value = 1; searchText.value = q.value.trim(); fetchProducts() }
function clearSearch()   { q.value = ''; searchText.value = ''; page.value = 1; fetchProducts() }

function openCreate() {
  isEdit.value = false
  resetForm()
  showForm.value = true
}
function openEdit(row: any) {
  isEdit.value = true
  resetForm()
  Object.assign(form, {
    _id: row._id,
    name: row.name,
    price: row.price,
    stock: row.stock,
    categoryId: row?.categoryId?._id || row?.categoryId || '',
    imageUrl: row.imageUrl || ''
  })
  imagePreview.value = row.imageUrl || ''
  showForm.value = true
}

async function save() {
  submitted.value = true
  if (!validateAll()) return

  try {
    saving.value = true

    // 1) upload ถ้ามีไฟล์
    const url = await uploadImageIfNeeded()

    // 2) สร้าง payload พร้อม imageUrl
    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      categoryId: form.categoryId,
      imageUrl: url
    }

    if (isEdit.value) await put(`/product/${form._id}`, payload)
    else await post('/product', payload)

    showForm.value = false
    await fetchProducts({ setLoading: false })
  } catch (e:any) {
    alert(e?.data?.message || e?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function removeRow(row: any) {
  if (!confirm('Delete this product?')) return
  try {
    loading.value = true
    await del(`/product/${row._id}`)
    await fetchProducts({ setLoading: false })
  } catch (e:any) {
    alert(e?.data?.message || e?.message || 'Delete failed')
  } finally {
    loading.value = false
  }
}

/* ---------- File input ---------- */
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] || null
  imageFile.value = file
  if (file) {
    const reader = new FileReader()
    reader.onload = () => { imagePreview.value = String(reader.result || '') }
    reader.readAsDataURL(file)
  } else {
    imagePreview.value = ''
  }
}

/* ---------- Effects ---------- */
watch([page, limit, categoryFilter], () => fetchProducts())

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchProducts()])
})
</script>

<template>
  <Shell>
    <template #title>Products</template>

    <div v-if="loading" class="flex items-center justify-center min-h-[calc(100dvh-140px)]">
      <Preloading type="bars" :bar-count="6" bars-height-class="h-32" />
    </div>

    <div v-else class="flex flex-col min-h-[calc(100dvh-140px)] pb-8 space-y-3">
      <!-- แถบค้นหา + กรอง Category -->
      <div class="flex flex-wrap items-center gap-2">
        <input
          v-model="q"
          type="text"
          placeholder="Search"
          class="px-3 py-2 rounded border w-64"
          aria-label="Search products"
          @keyup.enter="applySearch"
        />
        <button class="px-3 py-2 rounded border" @click="applySearch">Search</button>
        <button class="px-3 py-2 rounded border" @click="clearSearch" v-if="searchText || q">Clear</button>

        <div class="w-px h-6 bg-slate-300 mx-1" />
        <select v-model="categoryFilter" class="px-2 py-2 border rounded" aria-label="Filter by category">
          <option value="">All Categories</option>
          <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.name }}</option>
        </select>

        <div class="ml-auto">
          <button class="px-3 py-2 rounded bg-indigo-600 text-white" @click="openCreate">+ Add Product</button>
        </div>
      </div>

      <p v-if="errMsg" class="text-red-600 text-sm">{{ errMsg }}</p>

      <div class="flex-1 min-h-0 overflow-hidden rounded">
        <div class="h-full overflow-auto">
          <DataTable :columns="['Name','Category','Price','Stock','Actions']">
            <tr v-if="items.length === 0">
              <td class="px-3 py-6 text-slate-500" colspan="5">No data</td>
            </tr>

            <tr v-else v-for="row in items" :key="row._id" class="odd:bg-slate-900/5">
              <td class="px-3 py-2">
                <!-- คลิกชื่อเพื่อดูรายละเอียดเต็ม -->
                <button class="text-indigo-600 hover:underline" @click="openView(row)">
                  {{ row.name }}
                </button>
              </td>
              <td class="px-3 py-2">
                {{ row.categoryId?.name || (categories.find(c => c._id === row.categoryId)?.name) || '-' }}
              </td>
              <td class="px-3 py-2">{{ row.price }}</td>
              <td class="px-3 py-2">{{ row.stock }}</td>
              <td class="px-3 py-2 text-right space-x-2">
                <button class="px-2 py-1 rounded bg-slate-700 text-white" @click="openEdit(row)">Edit</button>
                <button class="px-2 py-1 rounded bg-rose-600 text-white" @click="removeRow(row)">Delete</button>
              </td>
            </tr>
          </DataTable>
        </div>
      </div>

      <div class="mt-auto pt-2 flex items-center justify-center gap-3">
        <button class="px-2 py-1 border rounded disabled:opacity-50" :disabled="!canPrev" @click="page--">Prev</button>
        <div class="text-sm">Page {{ page }} / {{ pageCount }}</div>
        <button class="px-2 py-1 border rounded disabled:opacity-50" :disabled="!canNext" @click="page++">Next</button>
        <div class="inline-flex items-center gap-2">
          <span class="text-sm">Per page</span>
          <select v-model.number="limit" :disabled="loading" class="border rounded px-2 py-1 disabled:opacity-50" aria-label="Rows per page">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <!-- Modal: Add/Edit (มีอัปโหลดรูป) -->
      <Modal v-model="showForm">
        <template #title>
          <div>{{ isEdit ? 'Edit Product' : 'Add Product' }}</div>
        </template>

        <div class="grid grid-cols-1 gap-3">
          <label class="block">
            <span class="text-sm">Name *</span>
            <input
              v-model="form.name"
              class="mt-1 w-full border rounded px-3 py-2"
              :class="{ 'border-rose-500': submitted && !!errors.name }"
              aria-describedby="prod-name-err"
            />
            <p v-if="submitted && errors.name" id="prod-name-err" class="mt-1 text-xs text-rose-600">
              {{ errors.name }}
            </p>
          </label>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label class="block">
              <span class="text-sm">Price *</span>
              <input
                v-model="form.price"
                type="number"
                inputmode="decimal"
                class="mt-1 w-full border rounded px-3 py-2"
                :class="{ 'border-rose-500': submitted && !!errors.price }"
                aria-describedby="prod-price-err"
              />
              <p v-if="submitted && errors.price" id="prod-price-err" class="mt-1 text-xs text-rose-600">
                {{ errors.price }}
              </p>
            </label>

            <label class="block">
              <span class="text-sm">Stock *</span>
              <input
                v-model="form.stock"
                type="number"
                inputmode="numeric"
                class="mt-1 w-full border rounded px-3 py-2"
                :class="{ 'border-rose-500': submitted && !!errors.stock }"
                aria-describedby="prod-stock-err"
              />
              <p v-if="submitted && errors.stock" id="prod-stock-err" class="mt-1 text-xs text-rose-600">
                {{ errors.stock }}
              </p>
            </label>
          </div>

          <label class="block">
            <span class="text-sm">Category *</span>
            <select
              v-model="form.categoryId"
              class="mt-1 w-full border rounded px-3 py-2"
              :class="{ 'border-rose-500': submitted && !!errors.categoryId }"
              aria-describedby="prod-cat-err"
            >
              <option value="" disabled>Select category</option>
              <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.name }}</option>
            </select>
            <p v-if="submitted && errors.categoryId" id="prod-cat-err" class="mt-1 text-xs text-rose-600">
              {{ errors.categoryId }}
            </p>
          </label>

          <!-- Upload รูป -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label class="block">
              <span class="text-sm">Image</span>
              <input type="file" accept="image/*" class="mt-1 w-full border rounded px-3 py-2"
                     @change="onFileChange" />
              <p class="text-xs text-slate-500 mt-1">
                รองรับไฟล์ภาพเท่านั้น
              </p>
            </label>

            <div>
              <span class="text-sm">Preview</span>
              <div class="mt-1 w-full border rounded p-2 flex items-center justify-center min-h-[120px] bg-slate-50">
                <img v-if="imagePreview || form.imageUrl"
                     :src="imagePreview || form.imageUrl"
                     alt="preview" class="max-h-40 object-contain" />
                <span v-else class="text-slate-400 text-sm">ไม่มีรูป</span>
              </div>
            </div>
          </div>
        </div>

        <template #actions>
          <button class="px-3 py-2 border rounded" :disabled="saving" @click="showForm=false">Cancel</button>
          <button class="px-3 py-2 rounded bg-indigo-600 text-white" :disabled="saving" @click="save">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </template>
      </Modal>

      <!-- Modal: View details -->
      <Modal v-model="showView" :width-class="'max-w-2xl'">
        <template #title>
          <div>Product Details</div>
        </template>

        <div v-if="viewRow" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center justify-center bg-slate-50 rounded p-3">
            <img v-if="viewRow.imageUrl" :src="viewRow.imageUrl" class="max-h-60 object-contain" />
            <div v-else class="text-slate-400">No Image</div>
          </div>
          <div class="space-y-2">
            <div><span class="text-slate-500 text-sm">Name</span><div class="font-medium">{{ viewRow.name }}</div></div>
            <div><span class="text-slate-500 text-sm">Category</span><div class="font-medium">
              {{ viewRow.categoryId?.name || (categories.find(c=>c._id===viewRow.categoryId)?.name) || '-' }}
            </div></div>
            <div class="grid grid-cols-2 gap-2">
              <div><span class="text-slate-500 text-sm">Price</span><div class="font-medium">{{ viewRow.price }}</div></div>
              <div><span class="text-slate-500 text-sm">Stock</span><div class="font-medium">{{ viewRow.stock }}</div></div>
            </div>
            <div><span class="text-slate-500 text-sm">ID</span><div class="font-mono text-xs">{{ viewRow._id }}</div></div>
          </div>
        </div>

        <template #actions>
          <button class="px-3 py-2 border rounded" @click="showView=false">Close</button>
        </template>
      </Modal>
    </div>
  </Shell>
</template>
