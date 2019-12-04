class Matching {
    constructor(io, db, sequelize){
        this.io = io;
        this.db = db;
        this.sequelize = sequelize;
    }

    async applicant_find_match(users, applicant){
        let min_match = 1;

        applicant = await this.getCompanyData(applicant);

        // this.alter_vacancies(applicant.uuid, [1])
        // this.alter_vacancies(applicant.uuid, ["We want someone who can so something", ["trait1", "trait2", "trait3"]])

        /** matching will return an array based on the companies that will match most, sorted first */
        let applicant_traits = applicant.traits;
            applicant_traits.splice(0,1);
        let matching = [];

        /** We loop backwards until the length of the traits is equal to the min_match
         *  Result will be an array with best matches in front
         */
        for(let t = applicant_traits.length; t > min_match - 1; t--){
            matching.push(await this.load_vacancy(
                /** Stringify the array for the query */
                JSON.stringify(applicant_traits)
            ))

            applicant_traits.splice(t - 1, 1)
        }

        let result = [];
        /** Filter out duplicates, keeping the most matched ones */
        for(let m = 0; m < matching.length; m++){
            /** for every company, if we did not filter it out yet, add to the result variable */
            for(let c = 0; c < matching[m].length; c++){
                let exists = false;

                for(let r = 0; r < result.length; r++)
                    if(result[r].uuid == matching[m][c].uuid)
                        exists = true;

                if(!exists)
                    result.push({
                        email:matching[m][c].email,
                        name:matching[m][c].name,
                        description:matching[m][c].traits[0],
                        uuid:matching[m][c].uuid
                    });
            }
        }

        users[this.indexOfUser(users, applicant.uuid)].socket.emit("vacancy_matches", result);
    }

    load_vacancy(traits){
        return new Promise(resolve => {
            this.db.companies.findAll({ where:
                {[this.sequelize.Op.or]:[
                    this.sequelize.literal(`json_contains(vacancies, '[${traits}]')`),
                ]}
            }).then(function(vacancies){
                resolve(vacancies);
            })
        });
    }

    /**
     * Adds or removes vacancies
     * @param {String} uuid         company uuid
     * @param {Array} vacancies     vacancy. array with vacancies will be added, array with ids will remove vacancies at that id.
     */
    async alter_vacancies(uuid, vacancies){
        let company = await this.getCompanyData(uuid);

        for(let v = 0; v < vacancies.length; v++){
            let process = new Promise(resolve => {
                company.updateVacancies(vacancies[v]);
            });

            await process;
        }
    }

    /**
     * Gets applicant data by their uuid
     * @param {String} uuid
     */
    async getApplicantData(uuid){
        return new Promise(resolve => {
            this.db.applicants.findOne({ where : { uuid: uuid }})
            .then(function(user){
                resolve(user);
            });
        });
    }

    /**
     * Gets company data by their uuid
     * @param {String} uuid
     */
    async getCompanyData(uuid){
        return new Promise(resolve => {
            this.db.companies.findOne({ where : { uuid: uuid }})
            .then(function(user){
                resolve(user);
            });
        }).catch(function(err){
            console.log(err)
        })
    }

    /**
     * Finds an user in the this.users object and returns its key
     * @param {String} identifier uuid or id of the one to be found
     * @returns {Int} index of user. -1 means not online
     */
    indexOfUser(users, identifier){
        for(var u = 0; u < users.length; u++)
            if(users[u].uuid == identifier || users[u].id == identifier)
                return u;

        // user not online
        return -1;
    }
}

module.exports = Matching;