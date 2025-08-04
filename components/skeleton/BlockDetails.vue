<template>
  <div>
    <!-- Header Tab Skeleton -->
    <div class="flex items-center gap-2 pb-3">
      <div class="h-8 w-20 bg-gray-600 rounded-lg animate-pulse"></div>
    </div>

    <!-- Main Block Details Card Skeleton -->
    <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-1">
      <div class="flex flex-col gap-6">
        <!-- Section 1: Core Information -->
        <div class="flex flex-col gap-4">
          <!-- Block Height -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-24 bg-gray-700 rounded"></div>
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
            <div class="flex items-center gap-2">
              <div class="h-5 w-8 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Status -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-16 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-6 w-20 bg-gray-600 rounded-md"></div>
            </div>
          </div>
          
          <!-- Creation Time -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-28 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-5 w-64 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Transactions -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-24 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-56 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Events -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-16 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-48 bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
        
        <!-- Divider -->
        <div class="h-px bg-gray-700"></div>
        
        <!-- Section 2: Miner and Difficulty -->
        <div class="flex flex-col gap-4">
          <!-- Miner Account -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-28 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-5 w-40 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Block Reward -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-24 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-20 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Difficulty -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-20 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-32 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Nonce -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-12 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-24 bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
        
        <!-- Divider -->
        <div class="h-px bg-gray-700"></div>
        
        <!-- Section 3: Gas -->
        <div class="flex flex-col gap-4">
          <!-- Gas Used -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-20 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-64 bg-gray-600 rounded-md"></div>
            </div>
          </div>
          
          <!-- Gas Limit -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-20 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-16 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Gas Price -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-20 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-24 bg-gray-600 rounded"></div>
            </div>
          </div>
          
          <!-- Kadena Price -->
          <div class="flex flex-col md:flex-row animate-pulse">
            <div class="w-[300px] flex-shrink-0">
              <div class="h-4 w-28 bg-gray-700 rounded"></div>
            </div>
            <div class="flex items-center">
              <div class="h-5 w-20 bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- More Details Card Skeleton -->
    <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5">
      <div class="flex flex-col md:flex-row animate-pulse">
        <div class="w-[300px] flex-shrink-0">
          <div class="h-4 w-24 bg-gray-700 rounded"></div>
        </div>
        <div class="flex items-center gap-1">
          <div class="h-5 w-36 bg-gray-600 rounded"></div>
        </div>
      </div>
    </div>
  </div>
</template> 