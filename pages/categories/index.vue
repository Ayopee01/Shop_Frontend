<script setup lang="ts">
definePageMeta({ layout: false })

import Shell from '~/components/Shell.vue'
import DataTable from '~/components/DataTable.vue'
import Modal from '~/components/Modal.vue'
import Preloading from '~/components/Preloading.vue'

const { get, post, put, del } = useApi()

/* ---------- ตาราง ---------- */
const q = ref('')                  // ค่าที่พิมพ์ในช่อง
const searchText = ref('')         // ค่าที่ใช้ค้นหาจริง (อัปเดตเมื่อกด Enter/ปุ่ม)
const page = ref(1)
const limit = ref(10)

const items = ref<any[]>([])
const total = ref(0)

const loading = ref(false)
const errMsg = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

/* ---------- ฟอร์ม ---------- */
const showForm = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const submitted = ref(false)

type CatForm = { _id: string; name: string; description: string }
const form = reactive<CatForm>({ _id: '', name: '', description: '' })
type CatErrors = Partial<Record<keyof CatForm, string>>
const errors = reactive<CatErrors>({})

function resetForm() {
  Object.assign(form, { _id: '', name: '', description: '' })
  Object.keys(errors).forEach(k => (errors as any)[k] = '')
  submitted.value = false
}

/* ---------- Validate (แสดงเมื่อกด Save เท่านั้น) ---------- */
function validateField(key: keyof CatForm) {
  errors[key] = ''
  if (key === 'name') {
    const n = form.name.trim()
    if (!n) errors.name = 'กรุณากรอกชื่อหมวดหมู่'
    else if (n.length < 2) errors.name = 'ต้องมีความยาวอย่างน้อย 2 ตัวอักษร'
    else if (n.length > 100) errors.name = 'ยาวเกิน 100 ตัวอักษร'
  }
  if (key === 'description') {
    if (form.description && form.description.length > 500)
      errors.description = 'คำอธิบายยาวเกิน 500 ตัวอักษร'
  }
}
function validateAll() {
  (['name','description'] as (keyof CatForm)[]).forEach(validateField)
  return !errors.name && !errors.description
}

/* ---------- Data ---------- */
async function fetchData() {
  loading.value = true
  errMsg.value = ''
  try {
    const res: any = await get('/categories', {
      page: page.value,
      limit: limit.value,
      q: searchText.value || ''
    })
    items.value = res?.items ?? []
    total.value = res?.total ?? 0
  } catch (e: any) {
    console.error(e)
    errMsg.value = e?.data?.message || e?.message || 'Failed to load categories'
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/* ---------- Actions ---------- */
function applySearch() {
  page.value = 1
  searchText.value = q.value.trim()
  fetchData()
}
function clearSearch() {
  q.value = ''
  searchText.value = ''
  page.value = 1
  fetchData()
}

function openCreate() { isEdit.value = false; resetForm(); showForm.value = true }
function openEdit(row: any) { isEdit.value = true; resetForm(); Object.assign(form, row); showForm.value = true }

async function save() {
  try {
    saving.value = true
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() ?? ''
    }
    if (isEdit.value) {
      await put(`/category/${form._id}`, payload)
    } else {
      await post('/category', payload)
    }
    showForm.value = false
    await fetchData()
  } catch (e:any) {
    alert(e?.data?.message || e?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function removeRow(row: any) {
  if (!confirm('Delete this category?')) return
  try {
    loading.value = true
    await del(`/category/${row._id}`)
    await fetchData()
  } catch (e:any) {
    alert(e?.data?.message || e?.message || 'Delete failed')
  } finally {
    loading.value = false
  }
}

/* กด Save: เซ็ต submitted ก่อน แล้วค่อย validate */
async function handleSave() {
  submitted.value = true
  if (validateAll()) await save()
}

/* ---------- Effects ---------- */
// ไม่ดู q ระหว่างพิมพ์ (ค้นหาเมื่อ Enter/คลิกปุ่ม เท่านั้น)
watch([page, limit], fetchData)
onMounted(fetchData)
</script>

<template>
  <Shell>
    <template #title>Categories</template>

    <div v-if="loading" class="flex items-center justify-center min-h-[70vh]">
      <Preloading type="bars" :bar-count="6" bars-height-class="h-32" />
    </div>

    <div v-else class="space-y-4">
      <!-- Search bar -->
      <div class="flex items-center gap-2">
        <input
          v-model="q"
          type="text"
          placeholder="Search"
          class="px-3 py-2 rounded border w-64"
          aria-label="Search categories"
          @keyup.enter="applySearch"
        />
        <button class="px-3 py-2 rounded border" @click="applySearch">Search</button>
        <button class="px-3 py-2 rounded border" v-if="q || searchText" @click="clearSearch">Clear</button>

        <div class="ml-auto">
          <button class="px-3 py-2 rounded bg-indigo-600 text-white" @click="openCreate">
            + Add Category
          </button>
        </div>
      </div>

      <p v-if="errMsg" class="text-sm text-red-600">{{ errMsg }}</p>

      <!-- Table -->
      <div class="flex-1 min-h-0 overflow-hidden rounded">
        <div class="h-full overflow-auto">
          <DataTable :columns="['Name', 'Description', 'Actions']">
            <tr v-if="items.length === 0">
              <td class="px-3 py-6 text-slate-500" colspan="3">No data</td>
            </tr>

            <tr v-else v-for="row in items" :key="row._id" class="odd:bg-slate-900/5">
              <td class="px-3 py-2">{{ row.name }}</td>
              <td class="px-3 py-2">{{ row.description }}</td>
              <td class="px-3 py-2 text-right space-x-2">
                <button class="px-2 py-1 rounded bg-slate-700 text-white" @click="openEdit(row)">Edit</button>
                <button class="px-2 py-1 rounded bg-rose-600 text-white" @click="removeRow(row)">Delete</button>
              </td>
            </tr>
          </DataTable>
        </div>
      </div>

      <!-- Pager -->
      <div class="flex items-center justify-center gap-3">
        <button class="px-2 py-1 border rounded disabled:opacity-50" :disabled="page<=1" @click="page--">Prev</button>
        <span>Page {{ page }} / {{ totalPages }}</span>
        <button class="px-2 py-1 border rounded disabled:opacity-50" :disabled="page>=totalPages" @click="page++">Next</button>
        <label class="ml-2 inline-flex items-center gap-2">
          <span class="text-sm">Per page</span>
          <select v-model.number="limit" class="border rounded px-2 py-1">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </label>
      </div>

      <!-- Modal -->
      <Modal v-model="showForm">
        <template #title>
          <div>{{ isEdit ? 'Edit Category' : 'Add Category' }}</div>
        </template>

        <div class="grid grid-cols-1 gap-3">
          <label class="block">
            <span class="text-sm">Name *</span>
            <input
              v-model="form.name"
              class="mt-1 w-full border rounded px-3 py-2"
              :class="{ 'border-rose-500': submitted && !!errors.name }"
              aria-describedby="cat-name-err"
            />
            <p v-if="submitted && errors.name" id="cat-name-err" class="mt-1 text-xs text-rose-600">
              {{ errors.name }}
            </p>
          </label>

          <label class="block">
            <span class="text-sm">Description</span>
            <textarea
              v-model="form.description"
              rows="3"
              class="mt-1 w-full border rounded px-3 py-2"
              :class="{ 'border-rose-500': submitted && !!errors.description }"
              aria-describedby="cat-desc-err"
            ></textarea>
            <p v-if="submitted && errors.description" id="cat-desc-err" class="mt-1 text-xs text-rose-600">
              {{ errors.description }}
            </p>
          </label>
        </div>

        <template #actions>
          <button class="px-3 py-2 border rounded" :disabled="saving" @click="showForm=false">Cancel</button>
          <button class="px-3 py-2 rounded bg-indigo-600 text-white" :disabled="saving" @click="handleSave">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </template>
      </Modal>
    </div>
  </Shell>
</template>
