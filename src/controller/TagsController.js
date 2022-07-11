const knex = require("../database/knex");

class TagsController {
  async index(request, response) {
    const user_id = request.user.id;

    const tags = await knex("movie-tags")
    .where({ user_id })
    .groupBy("name")

    return response.json(tags)
  }

  async delete(request, response) {
    const { id } = request.params;

    await knex("movie-tags").where({note_id: id}).delete()

    return response.json()
  }
}

module.exports = TagsController