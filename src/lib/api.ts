const BACKEND_URL = 'https://backend-mind-note.vercel.app';

// Category mapping: frontend category name -> backend category ID
let categoryMap: Record<string, string> = {};
let categoryIdToName: Record<string, string> = {};

// Load categories from backend and create mapping
export async function loadCategories() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/categories`);
    if (!res.ok) return;
    const json = await res.json();
    const categories = json.data || json || [];
    
    console.log('Backend categories loaded:', categories);
    
    // Map category names to IDs and IDs to names
    categoryMap = {};
    categoryIdToName = {};
    
    categories.forEach((cat: any) => {
      const backendName = cat.name.toLowerCase();
      const id = cat.id;
      
      // Map backend name directly
      categoryMap[backendName] = id;
      
      // Map to frontend category names
      if (backendName.includes('idea') || backendName === 'general') {
        categoryMap['ideas'] = id;
        categoryIdToName[id] = 'ideas';
      } else if (backendName.includes('tarea')) {
        categoryMap['tasks'] = id;
        categoryIdToName[id] = 'tasks';
      } else if (backendName.includes('reunion') || backendName.includes('meeting')) {
        categoryMap['meetings'] = id;
        categoryIdToName[id] = 'meetings';
      } else if (backendName.includes('personal')) {
        categoryMap['personal'] = id;
        categoryIdToName[id] = 'personal';
      } else if (backendName.includes('trabajo') || backendName.includes('work')) {
        categoryMap['work'] = id;
        categoryIdToName[id] = 'work';
      } else {
        // Fallback: use backend name as-is
        categoryIdToName[id] = backendName;
      }
    });
    
    console.log('Category mapping:', categoryMap);
    console.log('Category ID to name:', categoryIdToName);
  } catch (e) {
    console.error('Error loading categories:', e);
  }
}

// Get categoryId from category name
function getCategoryId(category: string): string | undefined {
  return categoryMap[category.toLowerCase()] || categoryMap['general'] || categoryMap['ideas'];
}

// Get category name from categoryId
export function getCategoryName(categoryId: string): string {
  return categoryIdToName[categoryId] || 'ideas';
}

// Notes API
export async function getNotes() {
  const res = await fetch(`${BACKEND_URL}/api/notes`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const json = await res.json();
  return json.data || json || [];
}

export async function createNote(title: string, content: string, category: string) {
  const categoryId = getCategoryId(category);
  const payload = { title, content, categoryId };
  console.log('Creating note with payload:', payload);
  const res = await fetch(`${BACKEND_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error('Create note error:', error);
    throw new Error(`Error ${res.status}`);
  }
  const json = await res.json();
  console.log('Created note response:', json);
  return json.data || json;
}

export async function updateNote(id: string, title: string, content: string, category: string) {
  const categoryId = getCategoryId(category);
  const payload = { title, content, categoryId };
  console.log('Updating note with payload:', payload);
  const res = await fetch(`${BACKEND_URL}/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error('Update note error:', error);
    throw new Error(`Error ${res.status}`);
  }
  const json = await res.json();
  console.log('Updated note response:', json);
  return json.data || json;
}

export async function deleteNote(id: string) {
  const res = await fetch(`${BACKEND_URL}/api/notes/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  // Tratar 404 como éxito - la nota ya no existe
  if (res.status === 404) return true;
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return true;
}

export async function summarizeText(text: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content: text,
        type: 'summary'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Error ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Respuesta del backend:', data);
    
    // Intentar extraer el resumen según la guía del backend
    const result = data.summary
      || data.data?.summary
      || data.data?.result
      || data.result
      || (typeof data === 'string' ? data : '');
    
    if (!result) {
      console.error('No se pudo extraer el resumen. Datos recibidos:', data);
      throw new Error('El backend no devolvió un resumen válido');
    }
    
    return result;
  } catch (error) {
    console.error('Error al resumir:', error);
    throw error;
  }
}
