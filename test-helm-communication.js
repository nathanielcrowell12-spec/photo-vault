/**
 * Test script for Helm Project communication
 * Run this to verify the communication bridge is working
 */

const testHelmCommunication = async () => {
  console.log('🧪 Testing Helm Project Communication...\n')

  try {
    // Test 1: Check if Helm Project is running
    console.log('1. Checking Helm Project status...')
    const helmResponse = await fetch('http://localhost:3001/api/system-status')
    
    if (helmResponse.ok) {
      const helmData = await helmResponse.json()
      console.log('✅ Helm Project is running')
      console.log(`   Status: ${helmData.status}`)
      console.log(`   Uptime: ${helmData.overall_uptime}%`)
    } else {
      console.log('❌ Helm Project is not responding')
      return
    }

    // Test 2: Send Photo Vault metrics to Helm Project
    console.log('\n2. Sending Photo Vault metrics to Helm Project...')
    const metricsResponse = await fetch('http://localhost:3000/api/helm/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (metricsResponse.ok) {
      const metricsData = await metricsResponse.json()
      console.log('✅ Metrics sent successfully')
      console.log(`   Message: ${metricsData.message}`)
    } else {
      console.log('❌ Failed to send metrics')
      const errorData = await metricsResponse.json()
      console.log(`   Error: ${errorData.error}`)
    }

    // Test 3: Check if Helm Project received the data
    console.log('\n3. Checking if Helm Project received Photo Vault data...')
    const receivedDataResponse = await fetch('http://localhost:3001/api/ventures/photovault/metrics')
    
    if (receivedDataResponse.ok) {
      const receivedData = await receivedDataResponse.json()
      console.log('✅ Helm Project received Photo Vault data')
      console.log(`   Success: ${receivedData.success}`)
      if (receivedData.data?.metrics) {
        console.log(`   Revenue: $${receivedData.data.metrics.revenue}`)
        console.log(`   Users: ${receivedData.data.metrics.activeUsers}`)
        console.log(`   Galleries: ${receivedData.data.metrics.galleriesCount}`)
      }
    } else {
      console.log('❌ Helm Project did not receive data')
    }

    console.log('\n🎉 Communication test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n💡 Make sure both projects are running:')
    console.log('   - Helm Project: http://localhost:3001')
    console.log('   - Photo Vault: http://localhost:3000')
  }
}

// Run the test
testHelmCommunication()
