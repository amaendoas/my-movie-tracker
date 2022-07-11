const knex = require("../database/knex");
const sqliteConnection = require('../database/sqlite');
const AppError = require("../utils/AppError");

class NotesController {
  async create(request, response) {
    const { title, description, tags, rating } = request.body
    const user_id = request.user.id;

    const note_id = await knex("movie-notes").insert({
      title,
      description,
      rating,
      user_id
    })

    if(!tags) {
      return response.json()
    }
    else {
      const tagsInsert = tags.map(name => {
        return {
          note_id,
          name,
          user_id
        }
      })
  
      await knex("movie-tags").insert(tagsInsert)
    }

    return response.json()

  }

  async update(request, response) {
    const { title, description, tags, rating } = request.body
    const { id } = request.params;
    const user_id = request.user.id;

    const database = await sqliteConnection();
    const note = await database.get("SELECT * FROM 'movie-notes' WHERE id = (?)", [id]);

    if(!note) {
      throw new AppError("Nota não encontrada!")
    }

    note.title = title ?? note.title;
    note.description = description ?? note.description;
    note.rating = rating ?? note.rating;
    
    await database.run(`
    UPDATE 'movie-notes' SET
    title = ?,
    description = ?,
    rating = ?,
    updated_at = DATETIME('now')
    WHERE id = ?
    `, [note.title, note.description, note.rating, id])
  
  if(!tags) {
    return response.json()

  } else {
    
    const tagsInsert = tags.map(name => {
      return {
        note_id: id,
        name,
        user_id
      }
    })
    
    await knex("movie-tags").where({note_id: id}).delete()
    await knex("movie-tags").insert(tagsInsert).where({note_id: id})
  }
    return response.json()
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
    const { title, tags } = request.query;
    const user_id = request.user.id;

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
      .groupBy("movie-notes.id")
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