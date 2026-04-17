<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold text-gray-900">Estate Commission Tracker</NuxtLink>
        <div class="flex gap-6 text-sm">
          <NuxtLink to="/" class="text-gray-600 hover:text-gray-900">Transactions</NuxtLink>
          <NuxtLink to="/agents" class="text-gray-600 hover:text-gray-900">Agents</NuxtLink>
        </div>
      </div>
    </nav>
    <main class="max-w-5xl mx-auto px-6 py-8">
      <NuxtPage />
    </main>
  </div>
</template>
