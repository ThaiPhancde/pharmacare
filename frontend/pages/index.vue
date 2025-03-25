<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { Users, BriefcaseMedical, Archive, TestTubeDiagonal } from 'lucide-vue-next'

const dataCard = ref({
  totalCustomer: 0,
  totalCustomerDesc: 0,
  totalMedicine: 0,
  totalMedicineDesc: 0,
  sales: 0,
  salesDesc: 0,
  expiredMedicine: 0,
  expiredMedicineDesc: 0,
})

const dataRecentSales = [
  {
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: 1999,
  },
  {
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: 39,
  },
  {
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: 299,
  },
  {
    name: 'William Kim',
    email: 'will@email.com',
    amount: 99,
  },
  {
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: 39,
  },
]

onMounted(() => {
  dataCard.value = {
    totalCustomer: 150,
    totalCustomerDesc: 20.1 / 100,
    totalMedicine: 1350,
    totalMedicineDesc: 180.5 / 100,
    sales: 12234,
    salesDesc: 45 / 100,
    expiredMedicine: 20,
    expiredMedicineDesc: 10,
  }
})
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">
        Dashboard
      </h2>
      <div class="flex items-center space-x-2">
        <BaseDateRangePicker />
        <Button>Download</Button>
      </div>
    </div>
    <main class="flex flex-1 flex-col gap-4 md:gap-8">
      <div class="grid gap-4 lg:grid-cols-4 md:grid-cols-2 md:gap-8">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-primary text-sm font-medium">
              Total Customer
            </CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow
                :value="dataCard.totalCustomer"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow
                :value="dataCard.totalCustomerDesc"
                prefix="+"
                :format="{ style: 'percent', minimumFractionDigits: 1 }"
              />
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-green-500 text-sm font-medium">
              Total Medicine
            </CardTitle>
            <BriefcaseMedical class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow
                :value="dataCard.totalMedicine"
                prefix="+"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow
                :value="dataCard.totalMedicineDesc"
                prefix="+"
                :format="{ style: 'percent', minimumFractionDigits: 1 }"
              /> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-red-500 text-sm font-medium">
              Out of Stock
            </CardTitle>
            <Archive class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow
                :value="dataCard.sales"
                prefix="+"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow
                :value="dataCard.salesDesc"
                prefix="+"
                :format="{ style: 'percent', minimumFractionDigits: 1 }"
              /> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-orange-500 text-sm font-medium">
              Expired Medicine
            </CardTitle>
            <TestTubeDiagonal class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              <NumberFlow
                :value="dataCard.expiredMedicine"
                prefix="+"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              <NumberFlow
                :value="dataCard.expiredMedicineDesc"
                prefix="-"
              /> since last week
            </p>
          </CardContent>
        </Card>
      </div>
      <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 md:gap-8">
        <Card class="xl:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent class="pl-2">
            <DashboardOverview />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-8">
            <div
              v-for="recentSales in dataRecentSales" :key="recentSales.name"
              class="flex items-center gap-4"
            >
              <Avatar class="hidden h-9 w-9 sm:flex">
                <AvatarFallback>{{ recentSales.name.split(' ').map((n) => n[0]).join('') }}</AvatarFallback>
              </Avatar>
              <div class="grid gap-1">
                <p class="text-sm font-medium leading-none">
                  {{ recentSales.name }}
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ recentSales.email }}
                </p>
              </div>
              <div class="ml-auto font-medium">
                <NumberFlow
                  :value="recentSales.amount"
                  :format="{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }"
                  prefix="+"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>
