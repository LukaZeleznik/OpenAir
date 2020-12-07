export const toolsMixins = {

    data() {
        return {
           villageName: this.$store.getters.getActiveVillageName,
        };
    },

    watch: {
        '$store.getters.getActiveVillageName': function() { this.villageName = this.$store.getters.getActiveVillageName },
    },

    methods: {
        secondsToTimeCompleted(seconds) {
            return new Date(seconds).toLocaleTimeString('sl-SI');
        },
        secondsToTimeRemaining(seconds) {
            return new Date(seconds).toISOString().substr(11, 8);
        },
        getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return false;
        },
        checkIfLoggedIn(redirectf){
            if(this.getCookie("jwt")){
                if(this.$route.name == "login" || this.$route.name == "register"){
                    if(redirectf) this.$router.push({ name: 'resources' });
                }
                return true;
            }
            else {
                if(this.$route.name != "login" && this.$route.name != "register"){
                    if(redirectf) this.$router.push({ name: 'login' });
                } 
                return false;
            }
        },
        async mapTileIdToIdVillage(mapTileId){
            return await(await(await this.doApiRequest("villages/" + mapTileId,"GET","",false)).json()).data._id;
        },
        async doApiRequest(path, method, data, jsonf) {
            let response;
            console.log('http://localhost:8080/api/' + path);
            if (jsonf){
                response = await fetch('http://localhost:8080/api/' + path, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
            } else {
                response = await fetch('http://localhost:8080/api/' + path, { method: method });
            }
            return response;
        },
        async getVillageName(){
            this.villageName = await(await(await this.doApiRequest("/villages/" + localStorage.getItem('activeVillageId'),"GET","",false)).json()).data.name;
            this.$store.commit('setActiveVillageName', this.villageName);
        },
    }
}