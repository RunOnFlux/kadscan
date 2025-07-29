<template>
  <div>
    <!-- Tabs Skeleton -->
    <div class="flex items-center justify-between pb-3">
      <div class="flex gap-2">
        <div class="h-8 w-20 bg-gray-600 rounded-lg animate-pulse"></div>
        <div class="h-8 w-16 bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
    </div>

    <!-- Main Transaction Details Card Skeleton -->
    <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-2">
      <div class="flex flex-col gap-6">
        <!-- Section 1: Basic Information -->
        <div class="flex flex-col gap-4">
          <!-- Transaction Hash -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-32 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center gap-2 flex-1">
              <div class="h-5 w-80 max-w-md bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Status -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-16 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-20 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Block -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-12 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-5 w-16 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Chain ID -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-20 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-12 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Timestamp -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-20 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-5 w-64 bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
        
        <!-- Divider -->
        <div class="h-px bg-gray-700"></div>
        
        <!-- Section 2: Addresses -->
        <div class="flex flex-col gap-4">
          <!-- Signers -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-16 bg-gray-700 rounded"></div>
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <div class="h-5 w-48 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
          
          <!-- Paid By -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-16 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-5 w-48 bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
        
        <!-- Divider -->
        <div class="h-px bg-gray-700"></div>
        
        <!-- Section 3: Token Transfers -->
        <div class="flex flex-col md:flex-row animate-pulse">
          <div class="w-[300px] flex-shrink-0">
            <div class="h-4 w-28 bg-gray-700 rounded"></div>
          </div>
          <div class="flex flex-col gap-3 flex-1">
            <div v-for="i in 2" :key="`transfer-${i}`" class="flex flex-wrap items-center gap-2">
              <div class="h-5 w-40 bg-gray-600 rounded"></div>
              <div class="h-5 w-40 bg-gray-600 rounded"></div>
              <div class="h-5 w-40 bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
        
        <!-- Divider -->
        <div class="h-px bg-gray-700"></div>
        
        <!-- Section 4: Misc Values -->
        <div class="flex flex-col gap-4">
          <!-- Value -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-12 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-5 w-40 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Transaction Fee -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-28 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-5 w-28 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Gas Price -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-20 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-20 bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- More Details Card Skeleton -->
    <div class="bg-[#111111] border border-[#222222] rounded-xl p-5 mb-2">
      <div class="flex flex-col md:flex-row animate-pulse">
        <div class="w-[300px] flex-shrink-0">
          <div class="h-4 w-24 bg-gray-700 rounded"></div>
        </div>
        <div class="flex items-center gap-1">
          <div class="h-5 w-32 bg-gray-600 rounded"></div>
        </div>
      </div>
    </div>
  </div>
</template> 