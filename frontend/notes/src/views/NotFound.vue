<template>
       <div class="flex justify-center items-center h-100 w-100">
              <a-card hoverable style="width: 600px">
                     <template #cover>
                            <img alt="example" src="@/assets/404.webp" />
                     </template>
                     <template #actions>
                            <home-outlined @click="returnHome" key="home" />
                     </template>
                     <a-card-meta description="Page not foud">
                            <template #title>
                                   <h1 class="text-2xl">Error 404</h1>
                            </template>
                     </a-card-meta>
              </a-card>
       </div>
</template>
<script lang="ts" setup>
import { HomeOutlined } from '@ant-design/icons-vue';
import router from '@/router';

const returnHome = () => {
       router.push({ name: 'notes' });
};
</script>