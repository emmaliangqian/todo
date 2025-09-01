class TodoApp {
  constructor() {
    // Load data from localStorage (maintain backward compatibility)
    this.loadData();
    
    // Theme management
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.currentSection = 'all';
    
    // DOM elements
    this.todoInput = document.getElementById('item');
    this.addBtn = document.getElementById('add');
    this.todoList = document.getElementById('todo-list');
    this.stats = document.getElementById('stats');
    this.themeToggle = document.getElementById('theme-toggle');
    this.sectionTabs = document.querySelectorAll('.section-tab');
    
    this.init();
  }
  
  loadData() {
    // Try to load new format first, then fall back to old format for backward compatibility
    const newData = localStorage.getItem('todos');
    if (newData) {
      this.todos = JSON.parse(newData);
      return;
    }
    
    // Fall back to old format
    const oldData = localStorage.getItem('todoList');
    if (oldData) {
      const parsed = JSON.parse(oldData);
      this.todos = [];
      
      // Convert old todo format to new format
      parsed.todo.forEach((text, index) => {
        this.todos.push({
          id: Date.now() + index,
          text: text,
          completed: false,
          createdAt: new Date().toISOString()
        });
      });
      
      parsed.completed.forEach((text, index) => {
        this.todos.push({
          id: Date.now() + 1000 + index,
          text: text,
          completed: true,
          createdAt: new Date().toISOString()
        });
      });
      
      // Save in new format and remove old format
      this.save();
      localStorage.removeItem('todoList');
    } else {
      this.todos = [];
    }
  }
  
  init() {
    // Initialize theme
    this.applyTheme(this.currentTheme);
    this.updateThemeToggleIcon();
    
    // Event listeners
    this.addBtn.addEventListener('click', () => this.addTodo());
    this.todoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.code === 'NumpadEnter') this.addTodo();
    });
    
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    
    // Section tab listeners
    this.sectionTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const section = e.target.getAttribute('data-section');
        this.switchSection(section);
      });
    });
    
    this.render();
  }
  
  addTodo() {
    const text = this.todoInput.value.trim();
    if (!text) return;
    
    const todo = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    this.todos.unshift(todo);
    this.todoInput.value = '';
    this.save();
    this.render();
  }
  
  toggleTodo(id) {
    this.todos = this.todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this.save();
    this.render();
  }
  
  deleteTodo(id) {
    const todoElement = document.querySelector(`[data-id="${id}"]`);
    if (todoElement) {
      todoElement.classList.add('removing');
      setTimeout(() => {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.save();
        this.render();
      }, 300);
    }
  }
  
  switchSection(section) {
    this.currentSection = section;
    
    // Update active tab
    this.sectionTabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-section') === section) {
        tab.classList.add('active');
      }
    });
    
    this.render();
  }
  
  getFilteredTodos() {
    const today = new Date().toDateString();
    
    switch (this.currentSection) {
      case 'today':
        return this.todos.filter(todo => {
          const todoDate = new Date(todo.createdAt).toDateString();
          return todoDate === today && !todo.completed;
        });
      case 'completed':
        return this.todos.filter(todo => todo.completed);
      case 'all':
      default:
        return this.todos.filter(todo => !todo.completed);
    }
  }
  
  save() {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }
  
  render() {
    const filteredTodos = this.getFilteredTodos();
    
    if (filteredTodos.length === 0) {
      const emptyMessages = {
        all: { emoji: '🌟', text: 'No tasks yet. Add one above to get started!' },
        today: { emoji: '📅', text: 'No tasks for today. Add one above!' },
        completed: { emoji: '✅', text: 'No completed tasks yet.' }
      };
      
      const message = emptyMessages[this.currentSection] || emptyMessages.all;
      
      this.todoList.innerHTML = `
        <div class="empty-state">
          <div>${message.emoji}</div>
          <p>${message.text}</p>
        </div>
      `;
    } else {
      this.todoList.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
          <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
               onclick="app.toggleTodo(${todo.id})">
            ${todo.completed ? '✓' : ''}
          </div>
          <div class="todo-text">${this.escapeHtml(todo.text)}</div>
          <button class="delete-btn" onclick="app.deleteTodo(${todo.id})">
            ✕
          </button>
        </div>
      `).join('');
    }
    
    this.updateStats();
  }
  
  updateStats() {
    const total = this.todos.length;
    const completed = this.todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const today = new Date().toDateString();
    const todayTasks = this.todos.filter(todo => {
      const todoDate = new Date(todo.createdAt).toDateString();
      return todoDate === today && !todo.completed;
    }).length;
    
    if (total === 0) {
      this.stats.textContent = '0 tasks';
    } else {
      switch (this.currentSection) {
        case 'today':
          this.stats.textContent = `${todayTasks} task${todayTasks !== 1 ? 's' : ''} for today`;
          break;
        case 'completed':
          this.stats.textContent = `${completed} completed task${completed !== 1 ? 's' : ''}`;
          break;
        case 'all':
        default:
          this.stats.textContent = `${total} task${total !== 1 ? 's' : ''} • ${completed} completed • ${pending} pending`;
          break;
      }
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Theme functions
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    this.updateThemeToggleIcon();
    localStorage.setItem('theme', this.currentTheme);
  }
  
  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
  
  updateThemeToggleIcon() {
    if (!this.themeToggle) return;
    
    const sunIcon = this.themeToggle.querySelector('.sun-icon');
    const moonIcon = this.themeToggle.querySelector('.moon-icon');
    
    if (!sunIcon || !moonIcon) {
      console.error('Theme toggle icons not found');
      return;
    }
    
    if (this.currentTheme === 'dark') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }
}

// Initialize the app
const app = new TodoApp();