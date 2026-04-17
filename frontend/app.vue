<template>
  <div class="min-h-screen bg-canvas font-sans">
    <!-- Top gold accent line -->
    <div class="fixed top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent z-50 pointer-events-none" />

    <!-- Navigation -->
    <nav class="sticky top-0 z-40 border-b border-border bg-canvas/85 backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div class="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center transition-all group-hover:border-gold/50 group-hover:bg-gold/15">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 12.5L4.5 7.5L7 9.5L10 4L12.5 1.5" stroke="#d4a853" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="leading-none">
            <span class="font-display text-[1.15rem] text-ink">Estate</span>
            <span class="font-display text-[1.15rem] text-gold ml-1.5">Commission</span>
          </div>
        </NuxtLink>

        <!-- Nav links -->
        <div class="flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-4 py-2 rounded-md text-sm transition-all duration-150"
            :class="$route.path === link.to
              ? 'bg-surface text-ink border border-border'
              : 'text-ink-2 hover:text-ink hover:bg-surface/70'"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="max-w-6xl mx-auto px-6 py-10">
      <NuxtPage />
    </main>

    <ToastStack />
  </div>
</template>

<script setup lang="ts">
const navLinks = [
  { to: '/', label: 'Transactions' },
  { to: '/reports', label: 'Reports' },
  { to: '/agents', label: 'Agents' },
]
</script>

<style>
html {
  background-color: #0b0d14;
  scroll-behavior: smooth;
}

body {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  color: #e8e4da;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::selection {
  background: rgba(212, 168, 83, 0.22);
  color: #e8c06a;
}

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #11141d; }
::-webkit-scrollbar-thumb { background: #252a3e; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #30374f; }

.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.card-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}
.card-lift:hover {
  transform: translateY(-2px);
  background-color: #161926;
  border-color: rgba(212, 168, 83, 0.22);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(212, 168, 83, 0.08);
}

.input-dark {
  display: block;
  width: 100%;
  background: #0b0d14;
  border: 1px solid #1e2232;
  color: #e8e4da;
  border-radius: 0.5rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: none;
}
.input-dark::placeholder { color: #535870; }
.input-dark:focus {
  border-color: rgba(212, 168, 83, 0.45);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.07);
}
.input-dark option {
  background: #11141d;
  color: #e8e4da;
}

.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.form-slide-enter-active,
.form-slide-leave-active {
  transition: opacity 0.22s ease, max-height 0.3s ease, margin 0.22s ease;
  overflow: hidden;
}
.form-slide-enter-from,
.form-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}
.form-slide-enter-to,
.form-slide-leave-from {
  opacity: 1;
  max-height: 700px;
  margin-bottom: 2rem;
}
</style>
