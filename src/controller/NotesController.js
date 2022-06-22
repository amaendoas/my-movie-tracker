const knex = require("../database/knex")

class NotesController {
  async create(request, response) {
    const { title, description, tags, rating } = request.body
    const{ user_id } = request.params

    const note_id = await knex("movie-notes").insert({
      title,
      description,
      rating,
      user_id
    })

    const tagsInsert = tags.map(name => {
      return {
        note_id,
        name,
        user_id
      }
    })

    await knex("movie-tags").insert(tagsInsert)

    response.json()

  }

  async show(request, response) {
    const { id } = request.params

    const note = await knex("movie-notes").where({ id }).first()
    const tags = await knex("movie-tags").where({note_id: id}).orderBy("name")

    return response.json({
      ...note,
      tags
    })
  }

  async delete(request, response) {
    const { id } = request.params

    await knex("movie-notes").where({id}).delete()

    return response.json()
  }

  async index(request, response) {
    const { user_id, title, tags } = request.query

    let notes

    if(tags) {
      const filterTags = tags.split(',').map(tag => tag.trim())

      notes = await knex("movie-tags").select([
        "movie-notes.id",
        "movie-notes.title",
        "movie-notes.user_id"
      ])
      .where("movie-notes.user_id", user_id)
      .whereLike("movie-notes.title", `%${title}%`)
      .whereIn("name", filterTags)
      .innerJoin("movie-notes", "movie-notes.id", "movie-tags.note_id")
      .orderBy("movie-notes.title")

    } else {
          notes = await knex("movie-notes").where({user_id}).whereLike("title", `%${title}%`).orderBy("title")
    }

    const userTags = await knex("movie-tags").where({user_id})
    const notesWithTags = notes.map(note => {
      const noteTags = userTags.filter(tag => tag.note_id === note.id)

      return {
        ...note,
        tags: noteTags
      }
    })

    return response.json(notesWithTags)
  }
}

module.exports = NotesController