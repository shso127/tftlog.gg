<template>
  <Navbar/>
  <Container/>
</template>

<script>
import Navbar from "./components/Navbar"
import Container from "./components/Container"

export default {
  name: 'App',
  components: {
    Navbar: Navbar,
    Container: Container,
}
}
</script>

<style>
</style>
