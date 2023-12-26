<template>
       <a-card hoverable style="width: 300px">
              <template #cover>
                     <img alt="example" src="@/assets/newNoteBanner.png" />
              </template>
              <template #actions>
                     <setting-outlined key="setting" />
                     <edit-outlined key="edit" />
                     <ellipsis-outlined key="ellipsis" />
              </template>
              <a-card-meta style="min-height: 200px;">
                     <template #title>
                            <a-input v-model:value="formState.title" placeholder="Your title" :bordered="false" size="large" :maxlength="20" />
                     </template>
                     <template #description>
                            <a-textarea v-model:value="formState.description"  placeholder="Content of your note ! :)" :bordered="false" :rows="8" />
                     </template>
              </a-card-meta>
       </a-card>
</template>
<script lang="ts" setup>
import { reactive } from 'vue';
import { SettingOutlined, EditOutlined, EllipsisOutlined } from '@ant-design/icons-vue';

interface FormState {
       title: string;
       description: string;
}
const formState = reactive<FormState>({
       title: '',
       description: '',
});

</script>