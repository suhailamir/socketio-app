module.exports = (bcrypt, sequelize) => {
  var Sequelize = new sequelize("nameinl_0001", "nameinl", "Dyro1992!", {
    dialect: "mariadb",
    host: "localhost",
    dialectOptions: { socketPath: "/var/lib/mysql/mysql.sock" }
  });
  var db = {};

  // applicants storage
  db.applicants = Sequelize.define(
    "applicants",
    {
      uuid: {
        type: sequelize.STRING,
        unique: true,
        allowNull: false
      },
      email: {
        type: sequelize.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: sequelize.STRING,
        allowNull: false
      },
      first_name: {
        type: sequelize.STRING,
        allowNull: false
      },
      middle_name: {
        type: sequelize.STRING,
        allowNull: true
      },
      surname: {
        type: sequelize.STRING,
        allowNull: false
      },
      traits: {
        type: sequelize.STRING,
        allowNull: false
      }
    },
    {
      hooks: {
        beforeCreate: user => {
          const salt = bcrypt.genSaltSync();
          user.password = bcrypt.hashSync(user.password, salt);
        }
      }
    }
  );
  db.applicants.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

  // company storage
  db.companies = Sequelize.define(
    "company",
    {
      uuid: {
        type: sequelize.STRING,
        unique: true,
        allowNull: false
      },
      email: {
        type: sequelize.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: sequelize.STRING,
        allowNull: false
      },
      name: {
        type: sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: sequelize.STRING,
        allowNull: false
      },
      company_description: {
        type: sequelize.STRING,
        allowNull: false
      },
      amount_vacancies: {
        type: sequelize.STRING,
        allowNull: false
      },
      company_type: {
        type: sequelize.STRING,
        allowNull: false
      },
      company_size: {
        type: sequelize.STRING,
        allowNull: false
      },
      traits: {
        type: sequelize.STRING,
        allowNull: false
      },
      location: {
        type: sequelize.STRING,
        allowNull: false
      },
      sector: {
        type: sequelize.STRING,
        allowNull: false
      }
    },
    {
      hooks: {
        beforeCreate: user => {
          const salt = bcrypt.genSaltSync();
          user.password = bcrypt.hashSync(user.password, salt);
        }
      }
    }
  );
  db.companies.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

  // vacancy storage
  db.vacancies = Sequelize.define("vacancies", {
    userId: {
      type: sequelize.STRING,
      allowNull: false
    },
    vacancy: {
      type: sequelize.STRING,
      allowNull: false
    }
  });

  db.vacancies.prototype.changeVacancy = function(vacancy) {
    this.vacancy = vacancy;
    this.save();
  };

  // chat storage
  db.chats = Sequelize.define("chats", {
    chatId: {
      type: sequelize.STRING,
      allowNull: false
    },
    user1Id: {
      type: sequelize.STRING,
      allowNull: false
    },
    user2Id: {
      type: sequelize.STRING,
      allowNull: false
    },
    archived: {
      type: sequelize.BOOLEAN,
      defaultValue: 0
    },
    rating: {
      type: sequelize.TINYINT,
      defaultValue: 0
    }
  });
  {
    db.chats.prototype.has_then_add_user = function(id) {
      // If the user is present
      if (this.user1Id == id || this.user2Id == id) return true;

      console.log(this.user1Id, this.user2Id, id);
      if (
        this.user1Id == "" &&
        (this.chatId == id + "-" + this.user2Id || this.user2Id + "-" + id)
      ) {
        this.user1Id = id;
      }

      if (
        this.user2Id == "" &&
        (this.chatId == id + "-" + this.user1Id || this.user1Id + "-" + id)
      ) {
        this.user2Id = id;
      }
      this.save();
    };
    /** Adds a user to the users section */
    db.chats.prototype.setArchived = function(state) {
      this.archived = state;
      this.save();
    };
    /** Adds a user to the users section */
    db.chats.prototype.setRating = function(rating) {
      this.rating = rating;
      this.save();
    };
  }

  // message storage
  db.messages = Sequelize.define("messages", {
    chatId: {
      type: sequelize.STRING,
      allowNull: false
    },
    senderId: {
      type: sequelize.STRING,
      allowNull: false
    },
    date: {
      type: sequelize.STRING,
      allowNull: false
    },
    message: {
      type: sequelize.STRING,
      allowNull: false
    }
  });

  Sequelize.sync()
    .then(() => console.log("Tables created."))
    .catch(error => console.log("Error: ", error));

  return db;
};
